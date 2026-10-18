<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { usePracticeStore } from '@/stores/practice'

const practice = usePracticeStore()
const scrollEl = ref<HTMLElement | null>(null)

const snapshot = computed(() => practice.snapshot)

function isCaret(segIndex: number, cellIndex: number): boolean {
  const snap = snapshot.value
  if (!snap || snap.cursor >= snap.totalChars) return false
  const segment = snap.segments[segIndex]
  return !!segment && snap.cursor === segment.start + cellIndex
}

function caretAtEnd(): boolean {
  const snap = snapshot.value
  return !!snap && snap.totalChars > 0 && snap.cursor >= snap.totalChars && snap.segments.length > 0
}

function keyLabel(key: string | null | undefined): string {
  if (!key) return '—'
  return key === ';' ? ';' : key.toUpperCase()
}

function scrollToCaret(): void {
  const element = scrollEl.value
  if (!element) return
  const caret = element.querySelector<HTMLElement>('.cell.caret')
  if (!caret) return
  const top = caret.offsetTop - element.clientHeight / 2 + caret.offsetHeight / 2
  element.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

watch(
  () => practice.snapshot?.cursor,
  () => {
    void nextTick(scrollToCaret)
  },
)
</script>

<template>
  <div class="typing-wrap">
    <div ref="scrollEl" class="typing-scroll">
      <p v-if="!snapshot || snapshot.totalChars === 0" class="typing-empty">
        当前关卡还没有可练习的内容，换一关试试。
      </p>
      <div v-else class="typing-text">
        <span
          v-for="segment in snapshot.segments"
          :key="segment.index"
          class="seg"
          :class="{ 'seg-active': segment.active, 'seg-done': segment.done }"
        >
          <span class="seg-code">
            <span
              v-for="(cell, cellIndex) in segment.chars"
              :key="cellIndex"
              class="cell"
              :class="[`is-${cell.status}`, { caret: isCaret(segment.index, cellIndex) }]"
            >{{ cell.ch }}</span>
            <span
              v-if="segment.active && segment.chars.length === snapshot?.activeCharIndex"
              class="cell caret caret-tail"
            > </span>
          </span>
          <span class="seg-label" :title="segment.tag || segment.text">{{ segment.text }}</span>
        </span>
        <span v-if="caretAtEnd()" class="cell caret caret-tail"> </span>
      </div>
    </div>

    <div class="typing-status">
      <span>
        下一个键
        <b class="mono next-key">{{ keyLabel(snapshot?.nextKey) }}</b>
      </span>
      <span v-if="snapshot?.activeLabel" class="faint">
        <template v-if="snapshot.segments[snapshot.activeSegIndex]?.tag">
          {{ snapshot.segments[snapshot.activeSegIndex]?.tag }} ·
        </template>
        <b>{{ snapshot.activeLabel }}</b>
      </span>
      <span class="typing-tip faint">请关闭中文输入法，使用英文键盘输入</span>
    </div>
  </div>
</template>

<style scoped>
.typing-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.typing-scroll {
  position: relative;
  min-height: 210px;
  max-height: 330px;
  overflow-y: auto;
  padding: 8px 4px 12px;
}

.typing-empty {
  padding: 60px 0;
  text-align: center;
  color: var(--text-faint);
  font-size: 13px;
}

.typing-text {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px 16px;
  padding-right: 8px;
  font-family: var(--font-mono);
  font-size: 24px;
  line-height: 1.3;
  letter-spacing: 0.05em;
}

.seg {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 2px;
}

.seg-code {
  display: inline-flex;
  align-items: baseline;
}

.cell {
  position: relative;
  color: var(--text-faint);
  border-radius: 3px;
  transition: color 100ms linear;
}

.cell.is-correct {
  color: var(--ok);
}

.cell.is-wrong {
  color: var(--err);
  background: var(--err-soft);
  text-decoration: underline wavy;
  text-underline-offset: 5px;
}

.seg-active .cell.is-pending {
  color: var(--text-soft);
}

.cell.caret::before {
  content: "";
  position: absolute;
  left: -2px;
  top: 3px;
  bottom: 2px;
  width: 2px;
  border-radius: 2px;
  background: var(--accent);
  animation: caret-blink 1.1s steps(1, end) infinite;
}

.cell.caret.caret-tail::before {
  left: 0;
}

.cell.caret-tail {
  display: inline-block;
  min-width: 3px;
}

.seg-label {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  white-space: nowrap;
  max-width: 12em;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.85;
}

.seg-active .seg-label {
  color: var(--accent);
  opacity: 1;
}

.seg-done .seg-label {
  opacity: 0.45;
}

.typing-status {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 12px;
  color: var(--text-soft);
  padding-top: 2px;
}

.next-key {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  margin-left: 4px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: var(--panel-soft);
  font-size: 12px;
  color: var(--text);
}

.typing-tip {
  margin-left: auto;
  font-size: 11.5px;
}

@keyframes caret-blink {
  0%,
  55% {
    opacity: 1;
  }
  56%,
  100% {
    opacity: 0;
  }
}
</style>
