<script setup lang="ts">
import { METHODS } from '@/types'
import type { ShuangpinSchemeId } from '@/types'
import { SHUANGPIN_SCHEMES } from '@/domain/shuangpin'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

function onSchemeChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  settings.setScheme(target.value as ShuangpinSchemeId)
}
</script>

<template>
  <div class="method-group">
    <div class="method-switch" role="tablist" aria-label="选择输入法">
      <button
        v-for="method in METHODS"
        :key="method.id"
        type="button"
        role="tab"
        :aria-selected="settings.state.method === method.id"
        :class="{ active: settings.state.method === method.id }"
        :title="method.blurb"
        @click="settings.setMethod(method.id)"
      >
        {{ method.name }}
      </button>
    </div>

    <select
      v-if="settings.isShuangpin"
      class="scheme-select"
      :value="settings.state.scheme"
      aria-label="双拼方案"
      @change="onSchemeChange"
    >
      <option v-for="(scheme, id) in SHUANGPIN_SCHEMES" :key="id" :value="id">
        {{ scheme.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.method-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
