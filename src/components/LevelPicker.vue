<script setup lang="ts">
import { computed } from 'vue'
import { levelKey } from '@/data/levels'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const progress = useProgressStore()

const currentIndex = computed(() => settings.state.levelIndexByMethod[settings.state.method])

function bestStars(index: number): number {
  const level = settings.levels[index]
  if (!level) return 0
  const scheme = settings.state.method === 'shuangpin' ? settings.state.scheme : null
  return progress.data.best[levelKey(settings.state.method, scheme, level.id, settings.state.mode)]?.stars ?? 0
}
</script>

<template>
  <div class="level-grid" role="tablist" aria-label="选择关卡">
    <button
      v-for="(level, index) in settings.levels"
      :key="level.id"
      type="button"
      role="tab"
      class="level-chip"
      :class="{ active: index === currentIndex }"
      :aria-selected="index === currentIndex"
      @click="settings.setLevelIndex(index)"
    >
      <span class="level-index">{{ String(index + 1).padStart(2, '0') }}</span>
      <span class="level-copy">
        <strong>{{ level.title }}</strong>
        <small>{{ level.tagline }}</small>
      </span>
      <span class="level-meta">
        <span v-if="bestStars(index)" class="stars" :title="`最佳 ${bestStars(index)} 星`">
          {{ '★'.repeat(bestStars(index)) }}<span class="empty">{{ '★'.repeat(3 - bestStars(index)) }}</span>
        </span>
        <span v-else class="faint">{{ level.itemCount }} 条</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.level-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.level-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  text-align: left;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  color: var(--text);
  transition: border-color var(--dur), background var(--dur), box-shadow var(--dur),
    transform var(--dur);
}

.level-chip:hover {
  border-color: var(--line-strong);
  transform: translateY(-1px);
}

.level-chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.level-index {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-faint);
  letter-spacing: 0.04em;
}

.level-chip.active .level-index {
  color: var(--accent-strong);
}

[data-theme="dark"] .level-chip.active .level-index {
  color: var(--accent);
}

.level-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.35;
}

.level-copy strong {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-copy small {
  font-size: 11px;
  color: var(--text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-meta {
  flex: none;
  font-size: 10.5px;
  color: var(--text-faint);
}

.level-meta .stars {
  font-size: 10.5px;
}
</style>
