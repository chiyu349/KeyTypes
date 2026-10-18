/**
 * 从 Rime 五笔 86 码表（wubi86.dict.yaml）生成站内使用的结构化码表。
 *
 * 用法：
 *   1. 下载 https://raw.githubusercontent.com/rime/rime-wubi/master/wubi86.dict.yaml
 *      到 qwer/.tmp/wubi86.dict.yaml
 *   2. 在 qwer/ 下执行 `node scripts/build-wubi-dict.mjs`
 *
 * 产物：src/data/wubi86.json
 *   chars   单字 → 全码（该字最长的那条编码）
 *   level1  单字 → 一级简码（单字母）
 *   level2  单字 → 二级简码（双字母）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.resolve(root, '../.tmp/wubi86.dict.yaml')
const outputPath = path.resolve(root, '../src/data/wubi86.json')

if (!fs.existsSync(sourcePath)) {
  console.error(`找不到码表源文件：${sourcePath}`)
  process.exit(1)
}

const raw = fs.readFileSync(sourcePath, 'utf8')
const lines = raw.split(/\r?\n/)
let inBody = false
const byChar = new Map()

for (const line of lines) {
  if (!inBody) {
    if (line.trim() === '...') inBody = true
    continue
  }
  if (!line || line.startsWith('#')) continue
  const [text, code] = line.split('\t')
  if (!text || !code) continue
  if (!/^[\u4e00-\u9fff]$/.test(text)) continue
  if (!/^[a-z]{1,4}$/.test(code)) continue
  const codes = byChar.get(text) ?? []
  codes.push(code)
  byChar.set(text, codes)
}

const chars = {}
const level1 = {}
const level2 = {}

for (const [char, rawCodes] of [...byChar.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh'))) {
  const codes = [...new Set(rawCodes)]
  // 全码取最长编码；同长时取在该字条目中靠前者（码表按常用度排列）
  let full = codes[0]
  for (const code of codes) if (code.length > full.length) full = code
  chars[char] = full
  const one = codes.find((code) => code.length === 1)
  if (one) level1[char] = one
  const two = codes.find((code) => code.length === 2)
  if (two) level2[char] = two
}

const payload = {
  meta: {
    source: 'rime/rime-wubi wubi86.dict.yaml',
    sourceUrl: 'https://github.com/rime/rime-wubi',
    generatedAt: new Date().toISOString(),
    chars: Object.keys(chars).length,
    level1: Object.keys(level1).length,
    level2: Object.keys(level2).length,
  },
  chars,
  level1,
  level2,
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(payload))
console.log(
  `已生成 ${outputPath}\n单字 ${payload.meta.chars} / 一级简码 ${payload.meta.level1} / 二级简码 ${payload.meta.level2}`,
)
