<script setup lang="ts">
import { computed } from 'vue'
import { getScheme } from '@/domain/shuangpin'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

const modeLabel = computed(() => (settings.state.mode === 'timed' ? `计时 ${settings.state.timeLimit} 秒` : '段落完成'))
const scheme = computed(() => (settings.isShuangpin ? getScheme(settings.state.scheme) : null))
</script>

<template>
  <section class="card card-pad settings-card">
    <div class="card-head">
      <span class="card-title">练习设置</span>
      <span class="tag">{{ modeLabel }}</span>
    </div>

    <div class="setting-row">
      <div class="setting-text">
        <strong>严格模式</strong>
        <small>打错不前进，必须按对才继续</small>
      </div>
      <button
        type="button"
        class="switch"
        role="switch"
        :aria-checked="settings.state.stopOnError"
        aria-label="严格模式"
        @click="settings.setStopOnError(!settings.state.stopOnError)"
      />
    </div>

    <div class="setting-row">
      <div class="setting-text">
        <strong>允许退格</strong>
        <small>退格不计击键，已记错误不回滚</small>
      </div>
      <button
        type="button"
        class="switch"
        role="switch"
        :aria-checked="settings.state.allowBackspace"
        aria-label="允许退格"
        @click="settings.setAllowBackspace(!settings.state.allowBackspace)"
      />
    </div>

    <div class="setting-row">
      <div class="setting-text">
        <strong>键位提示</strong>
        <small>高亮下一个该按的键</small>
      </div>
      <button
        type="button"
        class="switch"
        role="switch"
        :aria-checked="settings.state.showKeyboard"
        aria-label="键位提示"
        @click="settings.setShowKeyboard(!settings.state.showKeyboard)"
      />
    </div>

    <div class="setting-row">
      <div class="setting-text">
        <strong>错误提示音</strong>
        <small>按错时播放短促提示音</small>
      </div>
      <button
        type="button"
        class="switch"
        role="switch"
        :aria-checked="settings.state.soundOn"
        aria-label="错误提示音"
        @click="settings.setSoundOn(!settings.state.soundOn)"
      />
    </div>

    <p v-if="scheme" class="scheme-note faint small">
      {{ scheme.name }}：{{ scheme.description }}
    </p>
  </section>
</template>

<style scoped>
.settings-card {
  padding-top: 16px;
  padding-bottom: 14px;
}

.setting-row {
  padding: 8px 0;
}

.scheme-note {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
  line-height: 1.55;
}
</style>
