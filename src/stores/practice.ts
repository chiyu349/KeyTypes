import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { getLevel, getLevelItems } from '@/data/levels'
import { buildCustomItems, checkCustomText } from '@/domain/customText'
import { TypingEngine, type EngineSnapshot } from '@/domain/engine'
import { allowedKeysFor } from '@/domain/shuangpin'
import { starsFor, wpmOf } from '@/domain/scoring'
import { playErrorBeep } from '@/lib/sound'
import type {
  CustomText,
  ExerciseItem,
  FinishReason,
  SessionPhase,
  SessionResult,
  ShuangpinSchemeId,
} from '@/types'
import { useCustomTextsStore } from './customTexts'
import { useProgressStore } from './progress'
import { useSettingsStore } from './settings'

const TIMED_TARGET_CHARS = 80
const PASSAGE_TARGET_CHARS = 60
const CONTINUE_THRESHOLD = 30
const REFILL_GUARD = 120
const MIN_ABORT_MS = 5000
const MIN_ABORT_KEYSTROKES = 20

export const usePracticeStore = defineStore('practice', () => {
  const settings = useSettingsStore()
  const progress = useProgressStore()
  const customTexts = useCustomTextsStore()

  const phase = ref<SessionPhase>('idle')
  const snapshot = shallowRef<EngineSnapshot | null>(null)
  const elapsedMs = ref(0)
  const paused = ref(false)
  const result = ref<SessionResult | null>(null)
  const resultOpen = ref(false)
  const improved = ref(false)
  const activeCustom = ref<CustomText | null>(null)

  let engine: TypingEngine | null = null
  let pool: ExerciseItem[] = []
  let poolIndex = 0
  let timer: ReturnType<typeof setInterval> | null = null
  let activeSince: number | null = null
  let accumulatedMs = 0

  let sessionLevelId = ''
  let sessionLevelTitle = ''
  let sessionTargetCpm = 70

  const currentLevel = computed(() =>
    getLevel(settings.state.method, settings.state.levelIndexByMethod[settings.state.method]),
  )
  const levelIndex = computed(() => settings.state.levelIndexByMethod[settings.state.method])
  const targetCpm = computed(() => (activeCustom.value ? 100 : currentLevel.value.targetCpm))
  const timeLimitMs = computed(() =>
    settings.state.mode === 'timed' ? settings.state.timeLimit * 1000 : null,
  )
  const remainingMs = computed(() =>
    timeLimitMs.value === null ? null : Math.max(0, timeLimitMs.value - elapsedMs.value),
  )
  const progressRatio = computed(() => {
    if (!snapshot.value) return 0
    if (timeLimitMs.value !== null) return Math.min(1, elapsedMs.value / timeLimitMs.value)
    return snapshot.value.totalChars > 0 ? snapshot.value.cursor / snapshot.value.totalChars : 0
  })
  const isRunning = computed(() => phase.value === 'running')

  function elapsedNow(): number {
    return accumulatedMs + (activeSince !== null ? performance.now() - activeSince : 0)
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function startTimer(): void {
    clearTimer()
    timer = setInterval(() => {
      if (phase.value !== 'running' || paused.value) return
      elapsedMs.value = elapsedNow()
      if (timeLimitMs.value !== null && elapsedMs.value >= timeLimitMs.value) finish('timeout')
    }, 120)
  }

  function resolveCustom(): CustomText | null {
    const { textSource, activeCustomId, method } = settings.state
    if (textSource !== 'custom' || !activeCustomId) return null
    const item = customTexts.items.find((entry) => entry.id === activeCustomId)
    if (!item || item.method !== method) return null
    if (!checkCustomText(item.text, item.method).ok) return null
    return item
  }

  function pushNextItem(): void {
    if (!engine || pool.length === 0) return
    engine.pushItem(pool[poolIndex % pool.length] as ExerciseItem)
    poolIndex += 1
  }

  function fillInitialQueue(): void {
    if (!engine) return
    if (activeCustom.value && settings.state.mode === 'passage') {
      for (let index = 0; index < pool.length; index += 1) pushNextItem()
      return
    }
    const target = settings.state.mode === 'timed' ? TIMED_TARGET_CHARS : PASSAGE_TARGET_CHARS
    let guard = 0
    while (engine.remaining < target && guard < REFILL_GUARD) {
      pushNextItem()
      guard += 1
    }
  }

  function ensureQueue(): void {
    if (!engine || settings.state.mode !== 'timed') return
    if (engine.remaining >= CONTINUE_THRESHOLD) return
    let guard = 0
    while (engine.remaining < TIMED_TARGET_CHARS && guard < REFILL_GUARD) {
      pushNextItem()
      guard += 1
    }
  }

  function startFresh(): void {
    clearTimer()
    activeSince = null
    accumulatedMs = 0
    elapsedMs.value = 0
    paused.value = false
    phase.value = 'idle'
    result.value = null
    resultOpen.value = false
    improved.value = false
    poolIndex = 0

    const custom = resolveCustom()
    if (!custom && settings.state.textSource === 'custom') {
      // 自定义文本被删除或所属输入法不一致时，回到内置题库，避免空会话
      settings.useBuiltin()
    }
    activeCustom.value = custom

    pool = custom
      ? buildCustomItems(custom.text, custom.method, settings.state.scheme, custom.name)
      : getLevelItems(
          settings.state.method,
          settings.state.levelIndexByMethod[settings.state.method],
          settings.state.scheme,
        )

    sessionLevelId = custom ? `custom:${custom.id}` : currentLevel.value.id
    sessionLevelTitle = custom ? custom.name : currentLevel.value.title
    sessionTargetCpm = custom ? 100 : currentLevel.value.targetCpm

    engine = new TypingEngine({
      stopOnError: settings.state.stopOnError,
      allowBackspace: settings.state.allowBackspace,
      finishOnExhaust: settings.state.mode === 'passage',
      allowedKeys:
        settings.state.method === 'shuangpin'
          ? allowedKeysFor(settings.state.scheme)
          : /^[a-z]$/,
    })

    fillInitialQueue()
    snapshot.value = engine.snapshot()
  }

  function press(key: string): void {
    if (!engine || phase.value === 'finished') return
    if (phase.value === 'idle') {
      phase.value = 'running'
      activeSince = performance.now()
      startTimer()
    }
    const outcome = engine.press(key)
    if (!outcome.typed) return
    if (!outcome.correct && settings.state.soundOn) playErrorBeep()
    ensureQueue()
    snapshot.value = engine.snapshot()
    if (outcome.finished) finish('completed')
  }

  function backspace(): void {
    if (!engine || phase.value === 'finished') return
    if (engine.backspace()) snapshot.value = engine.snapshot()
  }

  function pause(): void {
    if (phase.value !== 'running' || activeSince === null) return
    accumulatedMs += performance.now() - activeSince
    activeSince = null
    paused.value = true
    elapsedMs.value = accumulatedMs
  }

  function resume(): void {
    if (phase.value !== 'running' || !paused.value) return
    activeSince = performance.now()
    paused.value = false
  }

  function finish(reason: FinishReason): void {
    if (!engine || phase.value === 'finished') return
    const elapsed = Math.max(1, elapsedNow())
    clearTimer()
    activeSince = null
    paused.value = false
    elapsedMs.value = elapsed
    phase.value = 'finished'

    const finalSnapshot = engine.snapshot()
    snapshot.value = finalSnapshot

    const minutes = elapsed / 60000
    const cpm = Math.round(finalSnapshot.correctChars / minutes)
    const accuracy = Math.round(finalSnapshot.accuracy * 10) / 10
    const stars: 0 | 1 | 2 | 3 =
      reason === 'aborted' ? 0 : starsFor(cpm, accuracy, sessionTargetCpm)

    const record: SessionResult = {
      id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      method: settings.state.method,
      scheme: settings.state.method === 'shuangpin' ? (settings.state.scheme as ShuangpinSchemeId) : null,
      levelId: sessionLevelId,
      levelTitle: sessionLevelTitle,
      mode: settings.state.mode,
      timeLimit: settings.state.mode === 'timed' ? settings.state.timeLimit : null,
      durationMs: Math.round(elapsed),
      cpm,
      wpm: wpmOf(cpm),
      accuracy,
      errors: finalSnapshot.wrongKeystrokes,
      totalKeystrokes: finalSnapshot.totalKeystrokes,
      correctChars: finalSnapshot.correctChars,
      stars,
      status: reason,
      finishedAt: Date.now(),
    }

    result.value = record

    const shouldSave =
      reason !== 'aborted' ||
      (elapsed >= MIN_ABORT_MS && finalSnapshot.totalKeystrokes >= MIN_ABORT_KEYSTROKES)
    if (shouldSave) {
      const outcome = progress.addResult(record)
      improved.value = outcome.improved
      resultOpen.value = true
    }
  }

  function endSession(): void {
    if (phase.value === 'running') finish('aborted')
  }

  function dismissResult(): void {
    resultOpen.value = false
  }

  function restart(): void {
    startFresh()
  }

  function stopTimers(): void {
    clearTimer()
    if (phase.value === 'running') {
      accumulatedMs = elapsedNow()
      activeSince = null
    }
  }

  return {
    phase,
    snapshot,
    elapsedMs,
    paused,
    result,
    resultOpen,
    improved,
    activeCustom,
    currentLevel,
    levelIndex,
    targetCpm,
    timeLimitMs,
    remainingMs,
    progressRatio,
    isRunning,
    startFresh,
    press,
    backspace,
    pause,
    resume,
    endSession,
    dismissResult,
    restart,
    stopTimers,
  }
})
