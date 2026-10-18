import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * GitHub Pages 项目站点部署在 https://<user>.github.io/<repo>/ 下，
 * 需要在构建时把资源前缀设为 /<repo>/；本地开发与用户站点保持 /。
 */
function resolveBase(): string {
  const raw = process.env.VITE_BASE?.trim()
  if (!raw) return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

export default defineConfig({
  base: resolveBase(),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
