<script setup lang="ts">
import MethodSwitcher from './MethodSwitcher.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="brand" aria-label="键道打字练习首页">
      <span class="brand-mark">键</span>
      <span class="brand-copy">
        <strong>键道</strong>
        <small>TYPE</small>
      </span>
    </RouterLink>

    <nav class="nav" aria-label="主导航">
      <RouterLink to="/">练习</RouterLink>
      <RouterLink to="/progress">成绩</RouterLink>
      <RouterLink to="/about">说明</RouterLink>
    </nav>

    <div class="header-tools">
      <MethodSwitcher />
      <button
        type="button"
        class="icon-btn"
        :title="settings.state.theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'"
        :aria-label="settings.state.theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'"
        @click="settings.toggleTheme()"
      >
        <svg
          v-if="settings.state.theme === 'dark'"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
        </svg>
        <svg
          v-else
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20.5 14.2A8.2 8.2 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        </svg>
      </button>
    </div>
  </header>
</template>
