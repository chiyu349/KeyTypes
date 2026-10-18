<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { rateLabel } from '@/domain/scoring'
import { formatDuration, formatPercent } from '@/lib/format'
import { usePracticeStore } from '@/stores/practice'
import { useSettingsStore } from '@/stores/settings'

const practice = usePracticeStore()
const settings = useSettingsStore()

const result = computed(() => practice.result)
const isCustom = computed(() => result.value?.levelId.startsWith('custom:') ?? false)
const canNext = computed(
  () => !isCustom.value && settings.state.levelIndexByMethod[settings.state.method] < 5,
)

function retry(): void {
  practice.restart()
}

function nextLevel(): void {
  settings.setLevelIndex(settings.state.levelIndexByMethod[settings.state.method] + 1)
  practice.dismissResult()
}

function close(): void {
  practice.dismissResult()
}

function onKeydown(event: KeyboardEvent): void {
  if (!practice.resultOpen) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault()
    retry()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="practice.resultOpen && result" class="modal-backdrop" @click.self="close">
      <div class="modal result-modal" role="dialog" aria-modal="true" aria-label="练习结果">
        <div class="result-head">
          <p class="eyebrow">
            {{ result.levelTitle }} ·
            {{ result.mode === 'timed' ? `${result.timeLimit} 秒计时` : '段落完成' }}
          </p>
          <div class="result-stars" :aria-label="`${result.stars} 星`">
            <span v-for="index in 3" :key="index" :class="{ on: index <= result.stars }">★</span>
          </div>
          <h2>{{ rateLabel(result.stars) }}</h2>
          <p v-if="practice.improved" class="record-badge">新纪录</p>
        </div>

        <div class="result-hero">
          <div class="hero-item">
            <span class="hero-value">{{ result.cpm }}</span>
            <span class="hero-unit">字 / 分</span>
          </div>
          <div class="hero-divider" />
          <div class="hero-item">
            <span class="hero-value">{{ result.wpm }}</span>
            <span class="hero-unit">WPM</span>
          </div>
        </div>

        <div class="result-grid">
          <div class="result-cell">
            <span>准确率</span>
            <strong>{{ formatPercent(result.accuracy) }}</strong>
          </div>
          <div class="result-cell">
            <span>错误</span>
            <strong>{{ result.errors }}</strong>
          </div>
          <div class="result-cell">
            <span>用时</span>
            <strong>{{ formatDuration(result.durationMs) }}</strong>
          </div>
          <div class="result-cell">
            <span>正确字符</span>
            <strong>{{ result.correctChars }}</strong>
          </div>
        </div>

        <div class="modal-foot">
          <button type="button" class="btn ghost" @click="close">关闭</button>
          <button type="button" class="btn" @click="retry">再来一次</button>
          <button v-if="canNext" type="button" class="btn primary" @click="nextLevel">
            下一关
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.result-modal {
  width: min(520px, 92vw);
  padding-top: 22px;
}

.result-head {
  position: relative;
  text-align: center;
  padding: 0 22px;
}

.result-stars {
  margin: 12px 0 2px;
  font-size: 30px;
  letter-spacing: 0.14em;
  color: var(--line-strong);
  line-height: 1;
}

.result-stars .on {
  color: var(--gold);
  text-shadow: 0 0 22px color-mix(in srgb, var(--gold) 35%, transparent);
}

.record-badge {
  position: absolute;
  top: 0;
  right: 22px;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--ok-soft);
  color: var(--ok);
  font-size: 11px;
  font-weight: 600;
}

.result-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin: 18px 0 18px;
}

.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-value {
  font-family: var(--font-mono);
  font-size: 46px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.hero-unit {
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.08em;
}

.hero-divider {
  width: 1px;
  height: 38px;
  background: var(--line);
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  margin: 0 22px 20px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.result-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: var(--panel);
}

.result-cell span {
  font-size: 12px;
  color: var(--text-faint);
}

.result-cell strong {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
