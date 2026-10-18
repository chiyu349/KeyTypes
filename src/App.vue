<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">
      键道 · 拼音 / 五笔 / 双拼打字练习 · 所有记录仅保存在本机浏览器
    </footer>
  </div>
</template>
