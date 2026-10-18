<script setup lang="ts">
import { computed } from 'vue'
import { KEYBOARD_ROWS, type KeyCap } from '@/data/keyboard'

const props = withDefaults(
  defineProps<{
    keys: Record<string, KeyCap>
    includeSemicolon?: boolean
    ariaLabel?: string
  }>(),
  {
    includeSemicolon: false,
    ariaLabel: '键盘键位图',
  },
)

const rows = computed(() =>
  KEYBOARD_ROWS.map((row) => row.filter((key) => key !== ';' || props.includeSemicolon)),
)
</script>

<template>
  <div class="keymap" role="img" :aria-label="ariaLabel">
    <div
      v-for="(row, rowIndex) in rows"
      :key="rowIndex"
      class="keymap-row"
      :class="`keymap-row-${rowIndex + 1}`"
    >
      <div v-for="key in row" :key="key" class="keycap" :class="{ muted: !keys[key] }">
        <span class="cap-letter">{{ key === ';' ? ';' : key.toUpperCase() }}</span>
        <span v-if="keys[key]?.tertiary" class="cap-zone">{{ keys[key]?.tertiary }}</span>
        <span class="cap-main" :class="{ compact: (keys[key]?.primary.length ?? 0) > 3 }">
          {{ keys[key]?.primary ?? '—' }}
        </span>
        <span v-if="keys[key]?.secondary" class="cap-sub">{{ keys[key]?.secondary }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.keymap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0 4px;
}

.keymap-row {
  display: flex;
  gap: 7px;
}

.keymap-row-2 {
  padding-left: 16px;
}

.keymap-row-3 {
  padding-left: 72px;
}

.keycap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 76px;
  height: 76px;
  padding: 14px 5px 7px;
  border: 1px solid var(--line);
  border-bottom: 2px solid var(--line-strong);
  border-radius: 10px;
  background: var(--panel-soft);
  transition: border-color var(--dur), background var(--dur);
}

.keycap:hover {
  border-color: var(--line-strong);
  background: var(--panel);
}

.keycap.muted {
  opacity: 0.4;
  border-style: dashed;
  background: transparent;
}

.cap-letter {
  position: absolute;
  top: 5px;
  left: 7px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  line-height: 1;
}

.cap-zone {
  position: absolute;
  top: 5px;
  right: 7px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--text-faint);
  line-height: 1;
}

.cap-main {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.15;
  color: var(--text);
  text-align: center;
}

.cap-main.compact {
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.01em;
}

.cap-sub {
  font-size: 9.5px;
  line-height: 1.2;
  color: var(--text-soft);
  white-space: nowrap;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
