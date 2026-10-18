<script setup lang="ts">
import { computed, ref } from 'vue'
import TrendChart from '@/components/TrendChart.vue'
import { methodName } from '@/types'
import { createBundle, downloadJson, parseBundle } from '@/lib/backup'
import { formatDate, formatDateTime, formatPercent } from '@/lib/format'
import { useCustomTextsStore } from '@/stores/customTexts'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import type { PracticeMode } from '@/types'

const settings = useSettingsStore()
const progress = useProgressStore()
const customTexts = useCustomTextsStore()

const fileInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const importOk = ref(true)

const scheme = computed(() =>
  settings.state.method === 'shuangpin' ? settings.state.scheme : null,
)
const schemeLabel = computed(() => {
  if (settings.state.method !== 'shuangpin') return ''
  return settings.state.scheme === 'xiaohe' ? '小鹤双拼' : settings.state.scheme === 'weiruan' ? '微软双拼' : '自然码双拼'
})

const recent = computed(() =>
  progress.recentFor(settings.state.method, scheme.value, 20).slice().reverse(),
)
const speedValues = computed(() => recent.value.map((item) => item.cpm))
const accuracyValues = computed(() => recent.value.map((item) => Math.round(item.accuracy * 10) / 10))

const methodResults = computed(() =>
  progress.results.filter((item) => item.method === settings.state.method),
)
const sessions = computed(() => methodResults.value.length)
const bestCpm = computed(() =>
  methodResults.value.reduce((max, item) => Math.max(max, item.cpm), 0),
)
const averageAccuracy = computed(() => {
  if (!methodResults.value.length) return 0
  return methodResults.value.reduce((sum, item) => sum + item.accuracy, 0) / methodResults.value.length
})
const bestStars = computed(() =>
  methodResults.value.reduce((max, item) => Math.max(max, item.stars), 0),
)

const history = computed(() =>
  progress.results
    .filter((item) => item.method === settings.state.method)
    .slice(0, 15),
)

function bestOf(levelId: string, mode: PracticeMode) {
  return progress.bestFor(settings.state.method, scheme.value, levelId, mode)
}

interface BestCell {
  stars: number
  text: string
}

interface BestRow {
  id: string
  title: string
  tagline: string
  itemCount: number
  timed: BestCell
  passage: BestCell
}

const bestRows = computed<BestRow[]>(() =>
  settings.levels.map((level) => {
    const timed = bestOf(level.id, 'timed')
    const passage = bestOf(level.id, 'passage')
    return {
      id: level.id,
      title: level.title,
      tagline: level.tagline,
      itemCount: level.itemCount,
      timed: timed
        ? { stars: timed.stars, text: `${timed.cpm} 字/分 · ${formatPercent(timed.accuracy)}` }
        : { stars: 0, text: '—' },
      passage: passage
        ? { stars: passage.stars, text: `${passage.cpm} 字/分 · ${formatPercent(passage.accuracy)}` }
        : { stars: 0, text: '—' },
    }
  }),
)

function exportData(): void {
  const bundle = createBundle(settings.state, progress.data, customTexts.data)
  downloadJson(`typing-practice-export-${formatDate(Date.now())}.json`, bundle)
}

async function handleFile(file: File): Promise<void> {
  const text = await file.text()
  const parsed = parseBundle(text)
  if (!parsed.ok) {
    importOk.value = false
    importMessage.value = parsed.error
    return
  }
  if (!window.confirm('导入会合并成绩记录与自定义文本（按 id 去重），是否继续？')) return

  const added = progress.mergeResults(parsed.bundle.progress.results)
  const customItems = parsed.bundle.custom?.items ?? []
  if (customItems.length) customTexts.merge(customItems)
  importOk.value = true
  importMessage.value = `导入完成：新增 ${added} 条成绩、${customItems.length} 条自定义文本。`
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void handleFile(file)
  input.value = ''
}

function onDrop(event: DragEvent): void {
  const file = event.dataTransfer?.files?.[0]
  if (file) void handleFile(file)
}

function clearRecords(): void {
  if (!window.confirm('确定清空全部成绩记录吗？自定义文本会保留，此操作不可撤销。')) return
  progress.clear()
  importMessage.value = '成绩记录已清空。'
  importOk.value = true
}
</script>

<template>
  <div class="progress-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Progress</p>
        <h1>成绩与趋势</h1>
        <p class="page-desc">
          当前查看：{{ methodName(settings.state.method) }}
          <template v-if="schemeLabel"> · {{ schemeLabel }}</template>
          。记录保存在本机浏览器，可导出 JSON 备份。
        </p>
      </div>
      <div class="head-actions">
        <button type="button" class="btn" @click="exportData">导出 JSON</button>
        <button type="button" class="btn" @click="fileInput?.click()">导入 JSON</button>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFileChange" />
      </div>
    </header>

    <section class="summary-grid">
      <div class="summary-card card">
        <span class="summary-label">练习次数</span>
        <strong class="summary-value">{{ sessions }}</strong>
        <span class="summary-foot faint">当前输入法累计</span>
      </div>
      <div class="summary-card card">
        <span class="summary-label">最佳速度</span>
        <strong class="summary-value">{{ bestCpm }}<small>字/分</small></strong>
        <span class="summary-foot faint">WPM {{ Math.round(bestCpm / 5) }}</span>
      </div>
      <div class="summary-card card">
        <span class="summary-label">平均准确率</span>
        <strong class="summary-value">{{ formatPercent(averageAccuracy) }}</strong>
        <span class="summary-foot faint">所有练习的平均值</span>
      </div>
      <div class="summary-card card">
        <span class="summary-label">最佳评级</span>
        <strong class="summary-value stars">
          {{ '★'.repeat(bestStars) }}<span class="empty">{{ '★'.repeat(3 - bestStars) }}</span>
        </strong>
        <span class="summary-foot faint">按关卡最佳成绩统计</span>
      </div>
    </section>

    <section class="card card-pad">
      <div class="card-head">
        <span class="card-title">趋势</span>
        <span class="faint small">最近 20 次练习</span>
      </div>
      <div class="charts">
        <TrendChart :values="speedValues" title="速度趋势" unit="字/分" />
        <TrendChart :values="accuracyValues" title="准确率趋势" unit="%" :precision="1" color="var(--ok)" />
      </div>
    </section>

    <section class="card card-pad">
      <div class="card-head">
        <span class="card-title">各关最佳</span>
        <span class="faint small">计时模式取 15/30/60 秒中的最好成绩</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>关卡</th>
              <th>计时最佳</th>
              <th>段落最佳</th>
              <th>题量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in bestRows" :key="row.id">
              <td>
                <strong>{{ row.title }}</strong>
                <div class="faint small">{{ row.tagline }}</div>
              </td>
              <td>
                <template v-if="row.timed.stars">
                  <span class="stars">
                    {{ '★'.repeat(row.timed.stars) }}<span class="empty">{{ '★'.repeat(3 - row.timed.stars) }}</span>
                  </span>
                  <div class="faint small">{{ row.timed.text }}</div>
                </template>
                <span v-else class="faint">—</span>
              </td>
              <td>
                <template v-if="row.passage.stars">
                  <span class="stars">
                    {{ '★'.repeat(row.passage.stars) }}<span class="empty">{{ '★'.repeat(3 - row.passage.stars) }}</span>
                  </span>
                  <div class="faint small">{{ row.passage.text }}</div>
                </template>
                <span v-else class="faint">—</span>
              </td>
              <td class="faint">{{ row.itemCount }} 条</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card card-pad">
      <div class="card-head">
        <span class="card-title">最近记录</span>
        <span class="faint small">最多显示 15 条</span>
      </div>
      <div v-if="history.length" class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>关卡</th>
              <th>模式</th>
              <th>速度</th>
              <th>准确率</th>
              <th>评级</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history" :key="item.id">
              <td class="faint">{{ formatDateTime(item.finishedAt) }}</td>
              <td><strong>{{ item.levelTitle }}</strong></td>
              <td class="faint">
                {{ item.mode === 'timed' ? `${item.timeLimit ?? '—'} 秒计时` : '段落完成' }}
              </td>
              <td><strong>{{ item.cpm }}</strong> <span class="faint small">字/分</span></td>
              <td>{{ formatPercent(item.accuracy) }}</td>
              <td>
                <span class="stars">
                  {{ '★'.repeat(item.stars) }}<span class="empty">{{ '★'.repeat(3 - item.stars) }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="faint empty-state">还没有练习记录，去「练习」页完成一次吧。</p>
    </section>

    <section class="card card-pad data-card">
      <div class="card-head">
        <span class="card-title">数据管理</span>
        <span class="faint small">localStorage · 无后端</span>
      </div>
      <div
        class="dropzone"
        @click="fileInput?.click()"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <strong>拖拽备份文件到这里，或点击选择</strong>
        <span class="faint small">导入会按 id 合并成绩和自定义文本，不会清空现有数据。</span>
      </div>
      <p v-if="importMessage" class="notice" :class="{ error: !importOk }">
        {{ importMessage }}
      </p>
      <div class="data-actions">
        <button type="button" class="btn" @click="exportData">导出全部数据</button>
        <button type="button" class="btn danger" @click="clearRecords">清空成绩记录</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.progress-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.page-desc {
  margin-top: 4px;
  color: var(--text-soft);
  font-size: 13px;
  max-width: 66ch;
}

.head-actions {
  display: flex;
  gap: 8px;
  flex: none;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}

.summary-label {
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}

.summary-value {
  font-family: var(--font-mono);
  font-size: 28px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.summary-value small {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--text-faint);
  margin-left: 3px;
  font-weight: 500;
}

.summary-value.stars {
  font-family: var(--font-sans);
  font-size: 24px;
  color: var(--gold);
}

.summary-foot {
  font-size: 11px;
}

.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.empty-state {
  padding: 14px 0 6px;
  font-size: 12.5px;
}

.dropzone {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 18px;
  margin: 6px 0 12px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  cursor: pointer;
  transition: border-color var(--dur), background var(--dur);
}

.dropzone:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.dropzone strong {
  font-size: 13px;
  font-weight: 600;
}

.data-actions {
  display: flex;
  gap: 8px;
}

[data-theme="dark"] .summary-value.stars {
  color: var(--gold);
}
</style>
