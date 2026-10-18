<script setup lang="ts">
import { computed } from 'vue'
import { usePracticeStore } from '@/stores/practice'
import { useSettingsStore } from '@/stores/settings'

const practice = usePracticeStore()
const settings = useSettingsStore()

const rows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

const nextKey = computed(() => practice.snapshot?.nextKey ?? null)
const showSemicolon = computed(
  () => settings.state.method === 'shuangpin' && settings.state.scheme === 'weiruan',
)
const activeSegment = computed(() => {
  const snap = practice.snapshot
  if (!snap) return null
  return snap.segments[snap.activeSegIndex] ?? null
})

function visibleRows(): string[][] {
  return rows.map((row) => row.filter((key) => key !== ';' || showSemicolon.value))
}
</script>

<template>
  <section class="card kbd-card" aria-label="键盘提示">
    <div class="kbd-head">
      <span class="card-title">键位提示</span>
      <span class="faint small">
        下一个键 <b class="mono kbd-next">{{ nextKey ? nextKey.toUpperCase() : '—' }}</b>
      </span>
    </div>
    <div class="kbd-rows">
      <div v-for="(row, rowIndex) in visibleRows()" :key="rowIndex" class="kbd-row">
        <kbd
          v-for="key in row"
          :key="key"
          class="kbd-key"
          :class="{ active: nextKey === key, semicolon: key === ';' }"
        >{{ key }}</kbd>
      </div>
    </div>
    <div class="kbd-meta">
      <span v-if="activeSegment" class="faint">
        目标 <b>{{ activeSegment.text }}</b>
        <span v-if="activeSegment.tag" class="tag tiny">{{ activeSegment.tag }}</span>
      </span>
      <span class="faint small">可单手盲打，建议十指分工</span>
    </div>
  </section>
</template>

<style scoped>
.kbd-card {
  padding: 16px 18px 15px;
}

.kbd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.kbd-next {
  color: var(--accent);
  font-size: 13px;
}

.kbd-rows {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.kbd-row {
  display: flex;
  gap: 5px;
}

.kbd-row:nth-child(2) {
  padding-left: 20px;
}

.kbd-row:nth-child(3) {
  padding-left: 54px;
}

.kbd-key {
  display: grid;
  place-items: center;
  width: 34px;
  height: 32px;
  border: 1px solid var(--line);
  border-bottom: 2px solid var(--line-strong);
  border-radius: 7px;
  background: var(--panel-soft);
  color: var(--text-soft);
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-transform: uppercase;
  transition: background 100ms linear, color 100ms linear, border-color 100ms linear,
    transform 100ms linear;
}

.kbd-key.active {
  background: var(--accent);
  border-color: var(--accent);
  border-bottom-color: var(--accent-strong);
  color: var(--accent-contrast);
  transform: translateY(1px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
}

.kbd-key.semicolon {
  opacity: 0.75;
}

.kbd-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 11px;
  font-size: 11.5px;
}

.tag.tiny {
  font-size: 10px;
  padding: 1px 6px;
  margin-left: 4px;
}
</style>
