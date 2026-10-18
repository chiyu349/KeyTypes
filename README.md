# 键道 · 打字练习

面向桌面浏览器的汉字输入练习站：**拼音 / 五笔 / 双拼** 三套分级课程，关闭输入法后按字母编码逐键击打，实时统计速度、准确率与错误率，成绩保存在本机浏览器。

- 纯前端单页应用，无后端、无账号、运行时零网络请求
- 拼音、五笔、双拼各 6 个等级，共 **1233 条**内置练习条目
- 支持小鹤 / 微软 / 自然码三套双拼方案，切换方案即时重算编码
- 支持自定义练习文本、难度开关、键位提示、错误提示音
- 导航「参考」页提供五笔字根键位图、助记词与三套双拼键位速记
- 浅色 / 暗色主题，1024–1920 宽桌面自适应

## 快速开始

环境：Node.js ≥ 20.19，pnpm ≥ 9（推荐 pnpm 11）。

```bash
cd qwer
pnpm install
pnpm dev        # 开发服务器，默认 http://localhost:5173
```

其他命令：

```bash
pnpm build      # vue-tsc 类型检查 + 构建到 dist/
pnpm preview    # 预览构建产物
pnpm test       # Vitest 单元测试
pnpm typecheck  # 只做类型检查
```

> 若安装时提示 esbuild 的构建脚本被忽略，请执行 `pnpm approve-builds` 选择 esbuild；仓库内的 `pnpm-workspace.yaml` 已为 pnpm 11 放行该脚本。

构建产物是纯静态文件。因为使用 HTML5 History 路由，部署到静态服务器时需要把未知路径回退到 `index.html`（Nginx `try_files $uri $uri/ /index.html;`）。

## 部署到 GitHub Pages

仓库内已包含 `.github/workflows/deploy.yml`：推送到 `main` 后会自动构建并发布。

1. 把 `qwer/` 作为仓库根目录推送到 GitHub（当前仓库为 `chiyu349/KeyTypes`）。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
   workflow 中的 `configure-pages` 会尝试自动开启 Pages；若首次运行提示 Pages 未启用，手动设置一次即可。
3. 推送后进入 **Actions → Deploy to GitHub Pages** 查看构建与部署进度。
4. 成功后访问 `https://<用户名>.github.io/<仓库名>/`，本项目即 <https://chiyu349.github.io/KeyTypes/>。

说明：

- 工作流根据仓库名自动设置 `VITE_BASE=/<仓库名>/`；仓库名形如 `<user>.github.io` 时使用 `/`。本地 `pnpm dev` 仍使用 `/`。
- History 路由需要 404 回退：工作流会生成 `dist/404.html`（入口页副本）和 `dist/.nojekyll`。
- 使用自定义域名（CNAME）时站点位于域名根路径，需要把 workflow 计算出的 `VITE_BASE` 改为 `/`。
- 私有仓库使用 Pages 需要 GitHub Pro，公开仓库免费。

本地验证 Pages 构建：

```powershell
$env:VITE_BASE="/KeyTypes/"
pnpm build
pnpm preview
```

```bash
# macOS / Linux / Git Bash
VITE_BASE=/KeyTypes/ pnpm build && pnpm preview
```

手动部署（不使用 Actions）时，执行 `pnpm build` 后把 `dist/` 上传到任意静态服务器，并配置 404 → `index.html`。

## 项目结构

```
qwer/
├─ index.html                  页面入口
├─ package.json                依赖与脚本
├─ vite.config.ts              Vite + Vitest 配置（@ 指向 src）
├─ pnpm-workspace.yaml         pnpm 构建脚本许可
├─ .github/workflows/
│  └─ deploy.yml               GitHub Pages 自动构建与部署
├─ scripts/
│  └─ build-wubi-dict.mjs      从 Rime 五笔码表生成 src/data/wubi86.json
├─ src/
│  ├─ main.ts / App.vue / router.ts
│  ├─ types.ts                 领域类型、设置与存储结构
│  ├─ styles/
│  │  ├─ tokens.css            亮/暗主题变量
│  │  └─ base.css              重置、栅格、按钮、卡片、弹窗、表格
│  ├─ domain/
│  │  ├─ engine.ts             逐键判定状态机与实时统计
│  │  ├─ pinyin.ts             汉字 → 无声调拼音（pinyin-pro）
│  │  ├─ shuangpin.ts          三套双拼键位表与编码转换
│  │  ├─ wubi.ts               五笔码表查询、词组取码、覆盖检查
│  │  ├─ customText.ts         自定义文本校验、分题、编码生成
│  │  └─ scoring.ts            星级、WPM、成绩比较
│  ├─ data/
│  │  ├─ corpus.ts             常用字、词语、短语、短句、段落语料
│  │  ├─ levels.ts             三法 × 6 级课程定义与题目构建
│  │  ├─ keyboard.ts           QWERTY 键位行与键帽类型
│  │  ├─ reference.ts          五笔区位/助记词、双拼键位与韵母对照
│  │  └─ wubi86.json           五笔 86 单字全码 / 一级简码 / 二级简码
│  ├─ lib/
│  │  ├─ format.ts             时间、百分比、日期格式化
│  │  ├─ storage.ts            localStorage 安全读写
│  │  ├─ backup.ts             JSON 备份生成与解析
│  │  └─ sound.ts              WebAudio 错误提示音
│  ├─ stores/
│  │  ├─ settings.ts           输入法、方案、模式、难度、主题
│  │  ├─ practice.ts           会话、计时、暂停、结算
│  │  ├─ progress.ts           成绩历史、最佳成绩、导入合并
│  │  └─ customTexts.ts        自定义文本库（最多 20 条）
│  ├─ components/              练习区、实时统计、键位提示、键位图、弹窗、趋势图、顶栏
│  └─ views/                   练习 / 成绩 / 参考 / 说明
└─ tests/                      引擎、双拼、五笔、课程数据单测
```

## 三种输入法与课程

练习采用**编码直打**：页面显示需要敲出的字母码（下方小字为对应汉字或字根），逐键比对，不依赖真实输入法的候选词。

| 输入法 | 练习内容 | 示例 |
| --- | --- | --- |
| 拼音 | 无声调拼音，按汉字逐音节输入 | `我们` → `wo men` |
| 五笔 86 | 一级简码、键名、字根键位、二级简码、全码、词组、短文 | `我` → `trnt`，`我们` → `trwu` |
| 双拼 | 每音节两键，支持小鹤 / 微软 / 自然码 | `中` → `vs`，`双` → `ul`（小鹤） |

各法 6 级（依次递进）：

| 等级 | 拼音 | 五笔 | 双拼 |
| --- | --- | --- | --- |
| 1 | 单音节 120 条 | 一级简码 + 键名 50 条 | 单音节 60 条 |
| 2 | 常用单字 80 条 | 字根键位 111 条 | 常用单字 60 条 |
| 3 | 双字词 90 条 | 二级简码 120 条 | 双字词 60 条 |
| 4 | 短语 70 条 | 常用字全码 150 条 | 短语 50 条 |
| 5 | 短句 40 条 | 常用词组 100 条 | 短句 30 条 |
| 6 | 段落 15 条 | 短文 15 条 | 段落 12 条 |

双拼三套方案的韵母键位对照 Rime 双拼方案的转换规则逐项核对；微软方案 `ing` 使用分号键，零声母音节加 `o` 前缀。

## 参考页（导航「参考」）

- **五笔 86**：25 键键位图（键名、常用字根、区位号）、25 条字根助记词、一级简码表、拆字与词组取码规则。
- **双拼**：小鹤 / 微软 / 自然码三套键位图（键帽标注韵母与 zh/ch/sh 特殊声母）、每套方案的速记要点与编码示例、零声母写法对照，以及 33 个韵母的三方案对照表。
- 参考页只做查阅，不会修改当前练习设置；页内「用五笔练习 / 用双拼练习」会切换输入法并回到练习页。

## 判定与统计口径

- 计时从**第一个有效击键**开始；切到其他标签页会暂停计时，返回后继续。
- **严格模式**：按错不前进，必须按对才继续；关闭后按错会前进并标红，可用退格修正。
- 退格不计入击键次数，已记录的错误不回滚。
- 空格键全局不参与判定；段与段之间自动衔接，不需要敲分隔符。
- 速度：`字/分 = 已正确字符数 ÷ 已用分钟`，`WPM = 字/分 ÷ 5`。
- 准确率：`正确击键 ÷ 总击键`；错误率 = `100% − 准确率`。
- 星级：准确率 ≥ 97% 且速度 ≥ 关卡目标 → 3★；准确率 ≥ 93% 且速度 ≥ 目标 80% → 2★；完成即 1★。

计时模式可选 15 / 30 / 60 秒，文本用尽自动续接同级别题目；段落模式写完整段后自动结算，也可按 `Esc` 提前结束（超过 5 秒且至少 20 次击键才计入成绩）。

## 快捷键

| 按键 | 作用 |
| --- | --- |
| `Enter` | 重新开始当前练习 |
| `Esc` | 结束本次并结算 |
| `Backspace` | 退格修正（可在设置中关闭） |
| `Space` | 不参与判定，可直接忽略 |

## 数据存储与备份

所有数据只保存在当前浏览器的 localStorage：

| 键 | 内容 |
| --- | --- |
| `typing-practice:v1:settings` | 主题、输入法、双拼方案、关卡、模式、难度开关 |
| `typing-practice:v1:progress` | 最近 200 条成绩、各关最佳记录 |
| `typing-practice:v1:custom` | 自定义练习文本（最多 20 条） |

「成绩」页可导出完整 JSON 备份，或拖拽 / 选择备份文件导入；导入按记录 id 合并成绩与自定义文本，不会清空现有数据。清空成绩记录保留自定义文本。

## 重新生成五笔码表

`src/data/wubi86.json` 由 Rime 五笔 86 码表离线生成，已随仓库提交，正常开发不需要重新生成。

```bash
# 1. 下载码表到 qwer/.tmp/wubi86.dict.yaml
#    https://raw.githubusercontent.com/rime/rime-wubi/master/wubi86.dict.yaml
# 2. 生成 JSON
node scripts/build-wubi-dict.mjs
```

生成规则：单字取该字最长编码作为全码，同时提取单字母（一级简码）与双字母（二级简码）条目；词组的四码按 86 版规则实时计算（二字词各取前两码、三字词前两字各一码加第三字前两码、四字词各取首码、多字词取前三字与末字首码）。

## 测试

```bash
pnpm test
```

覆盖：

- `tests/engine.test.ts`：正确/错误击键、严格与流式模式、退格、封顶结算、多段衔接、非字母按键过滤
- `tests/shuangpin.test.ts`：三套方案已知音节、零声母、分号键、编码长度
- `tests/wubi.test.ts`：高频字全码、一级简码、词组规则、未收录字
- `tests/levels.test.ts`：每法 6 级、条目编码结构、去重、总数、语料仅含汉字
- `tests/reference.test.ts`：五笔键位/区位/一级简码、三套双拼键位分组、零声母示例、韵母对照

## 已知限制

- 只面向桌面浏览器，最小布局宽度 1024px，不做移动端与触屏适配。
- 采用编码直打，不模拟真实输入法的候选词上屏；请将系统输入法切换为英文。
- 五笔字根关卡收录的是常用字根示例，不是完整字根总表；自定义文本中若有码表未收录的字会给出提示。
- `pinyin-pro` 对多音字取默认读音，个别字的拼音可能与预期不同。
- 切换输入法、双拼方案、等级、模式或难度会立即重置当前练习。

## 数据来源

- 五笔码表：Rime 五笔方案（<https://github.com/rime/rime-wubi>）的 `wubi86.dict.yaml`，仅供学习使用，请遵守上游仓库的授权条款。
- 拼音转换：[pinyin-pro](https://github.com/zh-lx/pinyin-pro)。
- 双拼键位：对照 Rime `rime-double-pinyin` 仓库中的自然码、小鹤、微软方案转换规则录入。
- 内置语料为项目自建常用字词句，不含第三方版权文本。
