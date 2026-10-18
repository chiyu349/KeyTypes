<script setup lang="ts">
import { WUBI_META } from '@/domain/wubi'
</script>

<template>
  <div class="about-page">
    <header class="about-hero">
      <p class="eyebrow">About</p>
      <h1>键道 · 打字练习</h1>
      <p class="about-lede">
        一个只做桌面端的汉字输入练习站：拼音、五笔、双拼三套分级课程，按字母编码逐键判定，
        实时统计速度、准确率与错误率，成绩保存在本机浏览器。
      </p>
      <div class="about-pills">
        <span class="tag">Vue 3 + Vite + TypeScript</span>
        <span class="tag">编码直打</span>
        <span class="tag">localStorage</span>
        <span class="tag">桌面端 ≥ 1024px</span>
      </div>
    </header>

    <section class="card card-pad about-section">
      <h2>三种输入法的练习规则</h2>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>输入法</th>
              <th>练习目标</th>
              <th>示例</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>拼音</strong></td>
              <td>无声调拼音逐字母输入，按音节分段自动进阶</td>
              <td class="mono">我们 → wo men</td>
            </tr>
            <tr>
              <td><strong>五笔 86</strong></td>
              <td>键名/一级简码、字根键位、二级简码、全码、词组、短文</td>
              <td class="mono">我 → trnt · 我们 → trwu</td>
            </tr>
            <tr>
              <td><strong>双拼</strong></td>
              <td>每个音节两键，支持小鹤 / 微软 / 自然码，切换方案实时重算编码</td>
              <td class="mono">中 → vs · 双 → ul / ud</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="about-note faint">
        练习时请关闭中文输入法，直接使用英文键盘。汉字只作为提示显示在编码下方，
        段与段之间不需要敲空格；空格键不参与判定。
      </p>
    </section>

    <section class="card card-pad about-section">
      <h2>项目结构</h2>
      <pre class="code">qwer/
├─ index.html                  页面入口
├─ package.json                依赖与脚本
├─ vite.config.ts              Vite / Vitest 配置
├─ scripts/
│  └─ build-wubi-dict.mjs      从 Rime 五笔码表生成站内 JSON
├─ src/
│  ├─ main.ts  App.vue  router.ts
│  ├─ styles/                  主题变量与基础样式
│  ├─ types.ts                 全局类型与存储结构
│  ├─ components/              练习区、统计、键位提示、弹窗、趋势图
│  ├─ views/                   练习 / 成绩 / 说明
│  ├─ domain/
│  │  ├─ engine.ts             逐键判定内核
│  │  ├─ pinyin.ts             汉字转无声调拼音
│  │  ├─ shuangpin.ts          三套双拼方案与编码转换
│  │  ├─ wubi.ts               五笔码表查询与词组规则
│  │  ├─ customText.ts         自定义文本校验与分题
│  │  └─ scoring.ts            星级与 WPM 计算
│  ├─ data/
│  │  ├─ corpus.ts             汉字、词语、短句、段落语料
│  │  ├─ levels.ts             三法 × 6 级课程定义
│  │  └─ wubi86.json           五笔 86 单字码表
│  ├─ lib/                     格式化、存储、提示音、备份
│  └─ stores/                  设置、练习会话、成绩、自定义文本
└─ tests/                      引擎、双拼、五笔、课程数据单测</pre>
    </section>

    <section class="card card-pad about-section">
      <h2>运行方式</h2>
      <pre class="code">cd qwer
pnpm install
pnpm dev        # 开发服务器，默认 http://localhost:5173
pnpm build      # 类型检查 + 构建到 dist/
pnpm preview    # 预览构建产物
pnpm test       # 运行单元测试</pre>
      <p class="about-note faint">
        需要 Node.js 20.19+ 与 pnpm。构建产物是纯静态文件，可放到任意静态服务器；
        因为使用 HTML5 History 路由，部署时需把未知路径回退到 index.html。
      </p>
    </section>

    <section class="card card-pad about-section">
      <h2>数据与实现</h2>
      <ul class="facts">
        <li>拼音由 <code>pinyin-pro</code> 在浏览器内转换为无声调拼音，多音字使用其默认读音。</li>
        <li>
          五笔单字码表来自 Rime 的
          <code>{{ WUBI_META.source }}</code>
          （共 {{ WUBI_META.chars }} 个单字、{{ WUBI_META.level1 }} 个一级简码、{{ WUBI_META.level2 }} 个二级简码），
          词组按 86 版取码规则实时计算。
        </li>
        <li>双拼键位对照 Rime 三套方案的转换规则录入：小鹤、微软、自然码；微软方案的 ing 使用分号键。</li>
        <li>准确率 = 正确击键 / 总击键；速度按已正确字符数计算，WPM = 字/分 ÷ 5；退格不计击键，已记错误不回滚。</li>
        <li>成绩、设置、自定义文本分别存放在三个 localStorage 键中，可导出 JSON 备份或迁移。</li>
      </ul>
    </section>

    <section class="card card-pad about-section">
      <h2>快捷键</h2>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>按键</th>
              <th>作用</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="mono">Enter</td><td>重新开始当前练习</td></tr>
            <tr><td class="mono">Esc</td><td>结束本次并结算</td></tr>
            <tr><td class="mono">Backspace</td><td>退格修正（可在设置中关闭）</td></tr>
            <tr><td class="mono">Space</td><td>不参与判定，可直接忽略</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card card-pad about-section">
      <h2>已知限制</h2>
      <ul class="facts">
        <li>仅面向桌面浏览器，最小布局宽度 1024px，不做触屏与移动端适配。</li>
        <li>采用「编码直打」，不模拟真实输入法的候选词上屏，因此统计口径稳定、也无输入法差异。</li>
        <li>五笔字根关卡为常用字根示例，并非完整字根总表；自定义文本要求每个字都在码表内。</li>
        <li>切换输入法、方案、关卡或难度会立即重置当前练习。</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.about-hero {
  padding: 8px 2px 2px;
}

.about-lede {
  margin-top: 8px;
  max-width: 68ch;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.7;
}

.about-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.about-section h2 {
  font-size: 17px;
  margin-bottom: 12px;
}

.about-note {
  margin-top: 12px;
  font-size: 12.5px;
  line-height: 1.65;
}

.code {
  margin: 0;
  padding: 16px 18px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--text-soft);
  tab-size: 2;
}

.facts {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.65;
}

.facts code {
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--panel-soft);
  border: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
}
</style>
