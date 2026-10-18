<script setup lang="ts">
import { computed } from 'vue'
import { formatClock, formatPercent } from '@/lib/format'
import { usePracticeStore } from '@/stores/practice'

const practice = usePracticeStore()

const snapshot = computed(() => practice.snapshot)
const phase = computed(() => practice.phase)

const minutes = computed(() => Math.max(practice.elapsedMs, 1000) / 60000)
const cpm = computed(() => {
  if (!snapshot.value?.correctChars) return 0
  return Math.round(snapshot.value.correctChars / minutes.value)
})
const wpm = computed(() => Math.round(cpm.value / 5))
const accuracy = computed(() => snapshot.value?.accuracy ?? 100)
const hasTyped = computed(() => (snapshot.value?.totalKeystrokes ?? 0) > 0)
const errorRate = computed(() => (hasTyped.value ? Math.max(0, 100 - accuracy.value) : 0))
const errors = computed(() => snapshot.value?.wrongKeystrokes ?? 0)
const keystrokes = computed(() => snapshot.value?.totalKeystrokes ?? 0)
const typed = computed(() => snapshot.value?.correctChars ?? 0)

const timeLabel = computed(() => (practice.timeLimitMs !== null ? '剩余时间' : '已用时间'))
const timeText = computed(() => {
  if (practice.timeLimitMs !== null) {
    const left = Math.max(0, (practice.timeLimitMs - practice.elapsedMs) / 1000)
    return formatClock(left)
  }
  return formatClock(practice.elapsedMs / 1000)
})

const statusText = computed(() => {
  if (phase.value === 'idle') return '等待输入，敲下第一个字母开始计时'
  if (phase.value === 'running') return practice.paused ? '已暂停（切回页面继续）' : '正在计时'
  return '本次练习已结束'
})
</script>

<template>
  <section class="card card-pad stats-card">
    <div class="stat-hero">
      <div class="stat-hero-main">
        <span class="stat-value">{{ cpm }}</span>
        <span class="stat-unit">字 / 分</span>
      </div>
      <span class="tag">WPM {{ wpm }}</span>
    </div>

    <div class="stat-grid">
      <div class="stat-item">
        <span class="stat-label">准确率</span>
        <strong class="stat-num" :class="{ good: hasTyped && accuracy >= 97, warn: hasTyped && accuracy < 93 }">
          {{ hasTyped ? formatPercent(accuracy) : '—' }}
        </strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">错误率</span>
        <strong class="stat-num" :class="{ warn: hasTyped && errorRate > 7 }">
          {{ hasTyped ? formatPercent(errorRate) : '—' }}
        </strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">错误次数</span>
        <strong class="stat-num">{{ errors }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">击键</span>
        <strong class="stat-num">{{ keystrokes }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">正确字符</span>
        <strong class="stat-num">{{ typed }}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ timeLabel }}</span>
        <strong class="stat-num mono">{{ timeText }}</strong>
      </div>
    </div>

    <div class="stat-progress" :title="`进度 ${Math.round(practice.progressRatio * 100)}%`">
      <span :style="{ width: `${Math.min(100, practice.progressRatio * 100)}%` }" />
    </div>
    <p class="stat-foot faint">{{ statusText }}</p>
  </section>
</template>

<style scoped>
.stats-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stat-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
}

.stat-hero-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 46px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.04em;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: 12px;
  color: var(--text-faint);
  letter-spacing: 0.06em;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 12px;
  background: var(--panel);
}

.stat-label {
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.04em;
}

.stat-num {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.stat-num.good {
  color: var(--ok);
}

.stat-num.warn {
  color: var(--err);
}

.stat-progress {
  height: 5px;
  border-radius: 999px;
  background: var(--bg-soft);
  overflow: hidden;
}

.stat-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, var(--ok)));
  transition: width 140ms linear;
}

.stat-foot {
  font-size: 11.5px;
  line-height: 1.5;
}
</style>
