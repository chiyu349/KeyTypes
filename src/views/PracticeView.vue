<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CustomTextDialog from '@/components/CustomTextDialog.vue'
import KeyboardHint from '@/components/KeyboardHint.vue'
import LevelPicker from '@/components/LevelPicker.vue'
import LiveStats from '@/components/LiveStats.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import TypingArea from '@/components/TypingArea.vue'
import { getScheme } from '@/domain/shuangpin'
import { formatPercent } from '@/lib/format'
import { usePracticeStore } from '@/stores/practice'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { methodName } from '@/types'

const settings = useSettingsStore()
const practice = usePracticeStore()
const progress = useProgressStore()

const dialogOpen = ref(false)
const imeWarning = ref(false)
const timeOptions: (15 | 30 | 60)[] = [15, 30, 60]

let imeTimer: ReturnType<typeof setTimeout> | null = null

const method = computed(() => settings.state.method)
const mode = computed(() => settings.state.mode)
const level = computed(() => settings.level)
const activeCustom = computed(() => practice.activeCustom)
const schemeInfo = computed(() => (settings.isShuangpin ? getScheme(settings.state.scheme) : null))

const best = computed(() => {
  const scheme = settings.state.method === 'shuangpin' ? settings.state.scheme : null
  const levelId = activeCustom.value ? `custom:${activeCustom.value.id}` : level.value.id
  return progress.bestFor(settings.state.method, scheme, levelId, settings.state.mode)
})

watch(
  () => [
    settings.state.method,
    settings.state.scheme,
    settings.state.mode,
    settings.state.timeLimit,
    settings.state.levelIndexByMethod[settings.state.method],
    settings.state.textSource,
    settings.state.activeCustomId,
    settings.state.stopOnError,
    settings.state.allowBackspace,
  ],
  () => practice.startFresh(),
)

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

function onKeydown(event: KeyboardEvent): void {
  if (event.repeat) return
  if (isTypingTarget(event.target)) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (dialogOpen.value || practice.resultOpen) return

  const targetTag = (event.target as HTMLElement | null)?.tagName
  if (targetTag === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) return

  if (event.key === 'Escape') {
    event.preventDefault()
    practice.endSession()
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    practice.restart()
    return
  }
  if (event.key === 'Backspace') {
    event.preventDefault()
    practice.backspace()
    return
  }
  if (event.key === ' ') {
    event.preventDefault()
    return
  }
  if (event.key.length === 1) {
    const key = event.key.toLowerCase()
    if (/^[a-z;]$/.test(key)) {
      event.preventDefault()
      practice.press(key)
    }
  }
}

function onCompositionStart(): void {
  imeWarning.value = true
  if (imeTimer) clearTimeout(imeTimer)
  imeTimer = setTimeout(() => {
    imeWarning.value = false
  }, 4000)
}

function onVisibilityChange(): void {
  if (document.hidden) practice.pause()
  else practice.resume()
}

onMounted(() => {
  practice.startFresh()
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('compositionstart', onCompositionStart)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  practice.stopTimers()
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('compositionstart', onCompositionStart)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (imeTimer) clearTimeout(imeTimer)
})
</script>

<template>
  <div class="practice-layout">
    <section class="practice-main">
      <header class="practice-head">
        <div class="practice-copy">
          <p class="eyebrow">
            {{ methodName(method) }}
            <template v-if="schemeInfo">· {{ schemeInfo.name }}</template>
            <template v-if="activeCustom">· 自定义文本</template>
          </p>
          <h1>{{ activeCustom ? activeCustom.name : level.title }}</h1>
          <p class="practice-desc">
            {{ activeCustom ? '按自己的文本练习，编码由当前输入法自动生成。' : level.description }}
          </p>
          <p class="practice-target faint">
            目标 {{ practice.targetCpm }} 字/分 · 3★ 需准确率 ≥ 97%
          </p>
        </div>

        <div class="practice-tools">
          <div class="segmented" role="group" aria-label="练习模式">
            <button
              type="button"
              :class="{ active: mode === 'timed' }"
              @click="settings.setMode('timed')"
            >
              计时
            </button>
            <button
              type="button"
              :class="{ active: mode === 'passage' }"
              @click="settings.setMode('passage')"
            >
              段落
            </button>
          </div>
          <div v-if="mode === 'timed'" class="segmented compact" role="group" aria-label="计时长度">
            <button
              v-for="option in timeOptions"
              :key="option"
              type="button"
              :class="{ active: settings.state.timeLimit === option }"
              @click="settings.setTimeLimit(option)"
            >
              {{ option }} 秒
            </button>
          </div>
        </div>
      </header>

      <LevelPicker v-if="!activeCustom" />

      <div v-else class="card custom-banner">
        <div class="custom-banner-copy">
          <span class="tag">自定义</span>
          <strong>{{ activeCustom.name }}</strong>
          <small class="faint">
            {{ activeCustom.text.length }} 字符 ·
            {{ mode === 'timed' ? `${settings.state.timeLimit} 秒计时` : '段落完成' }}
          </small>
        </div>
        <div class="custom-banner-actions">
          <button type="button" class="btn sm" @click="dialogOpen = true">管理</button>
          <button type="button" class="btn sm ghost" @click="settings.useBuiltin()">回到内置题库</button>
        </div>
      </div>

      <div class="card typing-card">
        <TypingArea />
        <p v-if="imeWarning" class="notice error ime-note">
          检测到中文输入法上屏，请切换到英文状态后再继续；本站按字母编码逐键判定。
        </p>
      </div>

      <KeyboardHint v-if="settings.state.showKeyboard" />

      <div class="practice-actions">
        <button type="button" class="btn primary" @click="practice.restart()">重新开始</button>
        <button type="button" class="btn ghost" @click="practice.endSession()">结束本次</button>
        <span class="faint small action-hint">
          Enter 重新开始 · Esc 结束 · 退格可修正
        </span>
      </div>
    </section>

    <aside class="practice-side">
      <LiveStats />
      <SettingsPanel />

      <section class="card card-pad side-card">
        <div class="card-head">
          <span class="card-title">自定义练习</span>
          <button type="button" class="btn sm" @click="dialogOpen = true">新建</button>
        </div>
        <p class="faint small side-note">
          粘贴自己的文章或句子，保存后按当前输入法生成编码，可重复练习。
        </p>
        <button type="button" class="btn block sm" @click="dialogOpen = true">打开文本库</button>
      </section>

      <section class="card card-pad side-card">
        <div class="card-head">
          <span class="card-title">本关最佳</span>
          <span class="tag">{{ mode === 'timed' ? `${settings.state.timeLimit} 秒` : '段落' }}</span>
        </div>
        <div v-if="best" class="best-grid">
          <div class="best-stars">
            <span class="stars">
              {{ '★'.repeat(best.stars) }}<span class="empty">{{ '★'.repeat(3 - best.stars) }}</span>
            </span>
          </div>
          <div class="best-item">
            <strong>{{ best.cpm }}</strong>
            <small>字/分</small>
          </div>
          <div class="best-item">
            <strong>{{ formatPercent(best.accuracy) }}</strong>
            <small>准确率</small>
          </div>
        </div>
        <p v-else class="faint small side-note">还没有记录，完成一次练习就会留下成绩。</p>
      </section>
    </aside>
  </div>

  <CustomTextDialog :open="dialogOpen" @close="dialogOpen = false" />
  <ResultDialog v-if="practice.resultOpen" />
</template>

<style scoped>
.practice-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.practice-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.practice-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.practice-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.practice-desc {
  color: var(--text-soft);
  font-size: 13px;
  max-width: 62ch;
}

.practice-target {
  font-size: 11.5px;
}

.practice-tools {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex: none;
}

.typing-card {
  padding: 22px 26px 18px;
}

.ime-note {
  margin-top: 12px;
}

.practice-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-hint {
  margin-left: auto;
}

.practice-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  padding-top: 16px;
  padding-bottom: 14px;
}

.side-note {
  font-size: 12px;
  line-height: 1.55;
  margin-bottom: 12px;
}

.custom-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
}

.custom-banner-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.custom-banner-copy strong {
  font-size: 13.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-banner-actions {
  display: flex;
  gap: 8px;
  flex: none;
}

.best-grid {
  display: flex;
  align-items: center;
  gap: 18px;
}

.best-stars {
  font-size: 15px;
}

.best-item {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.best-item strong {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.best-item small {
  font-size: 10.5px;
  color: var(--text-faint);
}

@media (max-width: 1240px) {
  .practice-layout {
    grid-template-columns: minmax(0, 1fr) 310px;
    gap: 18px;
  }

  .practice-head {
    align-items: flex-start;
  }
}
</style>
