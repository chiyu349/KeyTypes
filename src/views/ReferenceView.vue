<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import KeymapBoard from '@/components/KeymapBoard.vue'
import {
  FINAL_COMPARE_GROUPS,
  WUBI_LEVEL1,
  WUBI_MNEMONIC_LIST,
  ZERO_INITIAL_ROWS,
  buildShuangpinKeyCaps,
  buildWubiKeyCaps,
  getSchemeGuide,
} from '@/data/reference'
import { SHUANGPIN_SCHEMES } from '@/domain/shuangpin'
import { useSettingsStore } from '@/stores/settings'
import type { ShuangpinSchemeId } from '@/types'

type ReferenceTab = 'wubi' | 'shuangpin'

const settings = useSettingsStore()
const router = useRouter()

const tab = ref<ReferenceTab>(settings.state.method === 'shuangpin' ? 'shuangpin' : 'wubi')
const scheme = ref<ShuangpinSchemeId>(
  settings.state.method === 'shuangpin' ? settings.state.scheme : 'xiaohe',
)

const schemeList = Object.values(SHUANGPIN_SCHEMES)
const wubiCaps = buildWubiKeyCaps()
const shuangpinCaps = computed(() => buildShuangpinKeyCaps(scheme.value))
const guide = computed(() => getSchemeGuide(scheme.value))
const schemeInfo = computed(() => SHUANGPIN_SCHEMES[scheme.value])

function startPractice(method: 'wubi' | 'shuangpin'): void {
  settings.setMethod(method)
  if (method === 'shuangpin') settings.setScheme(scheme.value)
  void router.push('/')
}
</script>

<template>
  <div class="reference-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Reference</p>
        <h1>键位参考与速记</h1>
        <p class="page-desc">
          五笔字根与双拼键位速查，覆盖小鹤、微软、自然码三套方案。参考页只用于查阅，不会改变当前练习设置。
        </p>
      </div>
      <div class="segmented" role="tablist" aria-label="参考分类">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'wubi'"
          :class="{ active: tab === 'wubi' }"
          @click="tab = 'wubi'"
        >
          五笔 86
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'shuangpin'"
          :class="{ active: tab === 'shuangpin' }"
          @click="tab = 'shuangpin'"
        >
          双拼
        </button>
      </div>
    </header>

    <template v-if="tab === 'wubi'">
      <section class="card card-pad">
        <div class="card-head">
          <div>
            <h2>五笔键位图</h2>
            <p class="faint small">25 个字母键 · 键名 / 常用字根 / 区位号</p>
          </div>
          <span class="tag">Z 为学习键</span>
        </div>
        <KeymapBoard :keys="wubiCaps" aria-label="五笔字根键位图" />
        <p class="ref-note faint">
          键帽右上为区位号：横区 11–15、竖区 21–25、撇区 31–35、捺区 41–45、折区 51–55。
          大字为该键键名，下排为常用字根；Z 键仅用于学习查询，正式拆字不使用。
        </p>
      </section>

      <div class="ref-grid">
        <section class="card card-pad">
          <h2>字根助记词</h2>
          <ul class="mnemonic-list">
            <li v-for="item in WUBI_MNEMONIC_LIST" :key="item.key">
              <kbd>{{ item.key.toUpperCase() }}</kbd>
              <span>{{ item.text }}</span>
            </li>
          </ul>
        </section>

        <section class="card card-pad">
          <h2>一级简码</h2>
          <div class="level1-grid">
            <div v-for="item in WUBI_LEVEL1" :key="item.key" class="level1-item">
              <kbd>{{ item.key.toUpperCase() }}</kbd>
              <b>{{ item.char }}</b>
            </div>
          </div>

          <h2 class="sub-title">拆字与取码</h2>
          <ul class="tips">
            <li>顺序：书写顺序 → 取大优先 → 兼顾直观 → 能连不交 → 能散不连。</li>
            <li>单字：四码以上取一、二、三、末码；不足四码补末笔识别码。</li>
            <li>词组：两字各取前两码；三字取前两字首码加第三字前两码；四字各取首码；多字取前三字首码加末字首码。</li>
          </ul>

          <button type="button" class="btn primary block cta" @click="startPractice('wubi')">
            用五笔练习
          </button>
        </section>
      </div>
    </template>

    <template v-else>
      <section class="card card-pad">
        <div class="card-head">
          <div>
            <h2>双拼键位图</h2>
            <p class="faint small">每个键上的韵母 · 底部标注特殊声母</p>
          </div>
          <div class="segmented compact" role="tablist" aria-label="双拼方案">
            <button
              v-for="item in schemeList"
              :key="item.id"
              type="button"
              role="tab"
              :aria-selected="scheme === item.id"
              :class="{ active: scheme === item.id }"
              @click="scheme = item.id"
            >
              {{ item.shortName }}
            </button>
          </div>
        </div>

        <KeymapBoard
          :keys="shuangpinCaps"
          :include-semicolon="scheme === 'weiruan'"
          :aria-label="`${schemeInfo.name}键位图`"
        />
        <p class="ref-note faint">
          {{ schemeInfo.description }}。键帽中央为该键承载的韵母，底部 zh / ch / sh 表示该键同时承担特殊声母。
        </p>

        <div class="example-row">
          <span v-for="example in guide.examples" :key="example.text" class="example">
            <b>{{ example.text }}</b>
            <span class="mono">{{ example.code }}</span>
          </span>
        </div>
      </section>

      <div class="ref-grid">
        <section class="card card-pad">
          <h2>速记要点</h2>
          <ul class="tips">
            <li v-for="tip in guide.tips" :key="tip">{{ tip }}</li>
          </ul>
          <button type="button" class="btn primary block cta" @click="startPractice('shuangpin')">
            用双拼练习
          </button>
        </section>

        <section class="card card-pad">
          <h2>声母与零声母</h2>
          <p class="faint small intro">
            zh → V，ch → I，sh → U，其余声母与字母键相同。零声母音节按下列规则成码。
          </p>
          <table class="table">
            <thead>
              <tr>
                <th>音节</th>
                <th :class="{ active: scheme === 'xiaohe' }">小鹤</th>
                <th :class="{ active: scheme === 'weiruan' }">微软</th>
                <th :class="{ active: scheme === 'ziranma' }">自然码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in ZERO_INITIAL_ROWS" :key="row.label">
                <td>
                  <strong>{{ row.label }}</strong>
                  <span class="faint mono syllable">{{ row.syllable }}</span>
                </td>
                <td class="mono" :class="{ active: scheme === 'xiaohe' }">{{ row.xiaohe }}</td>
                <td class="mono" :class="{ active: scheme === 'weiruan' }">{{ row.weiruan }}</td>
                <td class="mono" :class="{ active: scheme === 'ziranma' }">{{ row.ziranma }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <div class="compare-grid">
        <section v-for="group in FINAL_COMPARE_GROUPS" :key="group.title" class="card card-pad">
          <h2>{{ group.title }}</h2>
          <table class="table compare-table">
            <thead>
              <tr>
                <th>韵母</th>
                <th :class="{ active: scheme === 'xiaohe' }">小鹤</th>
                <th :class="{ active: scheme === 'weiruan' }">微软</th>
                <th :class="{ active: scheme === 'ziranma' }">自然码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in group.rows" :key="row.label">
                <td><strong>{{ row.label }}</strong></td>
                <td class="mono" :class="{ active: scheme === 'xiaohe' }">{{ row.xiaohe }}</td>
                <td class="mono" :class="{ active: scheme === 'weiruan' }">{{ row.weiruan }}</td>
                <td class="mono" :class="{ active: scheme === 'ziranma' }">{{ row.ziranma }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.reference-page {
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
  max-width: 70ch;
}

.card h2 {
  font-size: 17px;
  margin-bottom: 12px;
}

.card-head h2 {
  margin-bottom: 2px;
}

.card-head > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ref-grid,
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: start;
}

.ref-note {
  margin-top: 12px;
  font-size: 12.5px;
  line-height: 1.65;
}

.mnemonic-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px 12px;
}

.mnemonic-list li {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-soft);
}

.mnemonic-list kbd,
.level1-item kbd {
  flex: none;
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--panel-soft);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text);
}

.level1-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}

.level1-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel-soft);
}

.level1-item b {
  font-size: 13px;
  font-weight: 600;
}

.sub-title {
  margin-top: 20px !important;
  font-size: 15px !important;
}

.tips {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text-soft);
}

.cta {
  margin-top: 16px;
}

.example-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.example {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-soft);
  font-size: 12px;
}

.example b {
  font-size: 13px;
  font-weight: 600;
}

.example .mono {
  color: var(--accent);
  letter-spacing: 0.08em;
}

.intro {
  margin: -4px 0 8px;
  font-size: 12px;
  line-height: 1.6;
}

.syllable {
  margin-left: 4px;
  font-size: 10.5px;
}

.table td.active,
.table th.active {
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 600;
}

[data-theme="dark"] .table td.active,
[data-theme="dark"] .table th.active {
  color: var(--accent);
}

@media (max-width: 1180px) {
  .ref-grid,
  .compare-grid {
    gap: 14px;
  }
}
</style>
