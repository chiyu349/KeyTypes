import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { LEVELS, getLevel } from '@/data/levels'
import { readStorage, writeStorage } from '@/lib/storage'
import type { InputMethod, PracticeMode, SettingsState, ShuangpinSchemeId, ThemeMode } from '@/types'

const STORAGE_KEY = 'typing-practice:v1:settings'
const LEVEL_INDEX_MAX = 5

function systemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function defaults(): SettingsState {
  return {
    version: 1,
    theme: systemTheme(),
    method: 'pinyin',
    scheme: 'xiaohe',
    mode: 'timed',
    timeLimit: 30,
    stopOnError: true,
    allowBackspace: true,
    showKeyboard: true,
    soundOn: false,
    levelIndexByMethod: { pinyin: 0, wubi: 0, shuangpin: 0 },
    textSource: 'builtin',
    activeCustomId: null,
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function clampIndex(value: unknown): number {
  const index = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0
  return Math.min(Math.max(index, 0), LEVEL_INDEX_MAX)
}

function sanitize(value: unknown): SettingsState {
  const base = defaults()
  if (!isObject(value)) return base
  const levelIndex = isObject(value.levelIndexByMethod) ? value.levelIndexByMethod : {}

  return {
    version: 1,
    theme: oneOf<ThemeMode>(value.theme, ['light', 'dark'], base.theme),
    method: oneOf<InputMethod>(value.method, ['pinyin', 'wubi', 'shuangpin'], base.method),
    scheme: oneOf<ShuangpinSchemeId>(value.scheme, ['xiaohe', 'weiruan', 'ziranma'], base.scheme),
    mode: oneOf<PracticeMode>(value.mode, ['timed', 'passage'], base.mode),
    timeLimit: (value.timeLimit === 15 || value.timeLimit === 30 || value.timeLimit === 60
      ? value.timeLimit
      : base.timeLimit) as 15 | 30 | 60,
    stopOnError: typeof value.stopOnError === 'boolean' ? value.stopOnError : base.stopOnError,
    allowBackspace: typeof value.allowBackspace === 'boolean' ? value.allowBackspace : base.allowBackspace,
    showKeyboard: typeof value.showKeyboard === 'boolean' ? value.showKeyboard : base.showKeyboard,
    soundOn: typeof value.soundOn === 'boolean' ? value.soundOn : base.soundOn,
    levelIndexByMethod: {
      pinyin: clampIndex(levelIndex.pinyin),
      wubi: clampIndex(levelIndex.wubi),
      shuangpin: clampIndex(levelIndex.shuangpin),
    },
    textSource: value.textSource === 'custom' ? 'custom' : 'builtin',
    activeCustomId: typeof value.activeCustomId === 'string' ? value.activeCustomId : null,
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = readStorage<unknown>(STORAGE_KEY, null, (value): value is unknown => value !== null)
  const state = ref<SettingsState>(sanitize(stored))

  const levels = computed(() => LEVELS[state.value.method])
  const levelIndex = computed(() => state.value.levelIndexByMethod[state.value.method])
  const level = computed(() => getLevel(state.value.method, levelIndex.value))
  const isShuangpin = computed(() => state.value.method === 'shuangpin')

  function persist(): void {
    writeStorage(STORAGE_KEY, state.value)
  }

  watch(state, persist, { deep: true })

  function applyTheme(): void {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = state.value.theme
    document.documentElement.style.colorScheme = state.value.theme
  }

  applyTheme()
  watch(() => state.value.theme, applyTheme)

  function setMethod(method: InputMethod): void {
    if (state.value.method === method) return
    state.value.method = method
    state.value.textSource = 'builtin'
    state.value.activeCustomId = null
  }

  function setScheme(scheme: ShuangpinSchemeId): void {
    state.value.scheme = scheme
  }

  function setMode(mode: PracticeMode): void {
    state.value.mode = mode
  }

  function setTimeLimit(limit: 15 | 30 | 60): void {
    state.value.timeLimit = limit
  }

  function setLevelIndex(index: number): void {
    state.value.levelIndexByMethod[state.value.method] = clampIndex(index)
  }

  function setStopOnError(value: boolean): void {
    state.value.stopOnError = value
  }

  function setAllowBackspace(value: boolean): void {
    state.value.allowBackspace = value
  }

  function setShowKeyboard(value: boolean): void {
    state.value.showKeyboard = value
  }

  function setSoundOn(value: boolean): void {
    state.value.soundOn = value
  }

  function setTheme(theme: ThemeMode): void {
    state.value.theme = theme
  }

  function toggleTheme(): void {
    state.value.theme = state.value.theme === 'light' ? 'dark' : 'light'
  }

  function useCustomText(id: string, method: InputMethod): void {
    state.value.method = method
    state.value.textSource = 'custom'
    state.value.activeCustomId = id
  }

  function useBuiltin(): void {
    state.value.textSource = 'builtin'
    state.value.activeCustomId = null
  }

  function replace(next: SettingsState): void {
    state.value = sanitize(next)
  }

  return {
    state,
    levels,
    levelIndex,
    level,
    isShuangpin,
    setMethod,
    setScheme,
    setMode,
    setTimeLimit,
    setLevelIndex,
    setStopOnError,
    setAllowBackspace,
    setShowKeyboard,
    setSoundOn,
    setTheme,
    toggleTheme,
    useCustomText,
    useBuiltin,
    replace,
  }
})
