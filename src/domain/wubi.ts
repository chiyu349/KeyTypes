import rawDict from '@/data/wubi86.json'

export interface WubiDict {
  meta: {
    source: string
    sourceUrl: string
    generatedAt: string
    chars: number
    level1: number
    level2: number
  }
  chars: Record<string, string>
  level1: Record<string, string>
  level2: Record<string, string>
}

export const WUBI_DICT = rawDict as unknown as WubiDict

export const WUBI_KEY_NAMES: { key: string; char: string }[] = [
  { key: 'g', char: '王' },
  { key: 'f', char: '土' },
  { key: 'd', char: '大' },
  { key: 's', char: '木' },
  { key: 'a', char: '工' },
  { key: 'h', char: '目' },
  { key: 'j', char: '日' },
  { key: 'k', char: '口' },
  { key: 'l', char: '田' },
  { key: 'm', char: '山' },
  { key: 't', char: '禾' },
  { key: 'r', char: '白' },
  { key: 'e', char: '月' },
  { key: 'w', char: '人' },
  { key: 'q', char: '金' },
  { key: 'y', char: '言' },
  { key: 'u', char: '立' },
  { key: 'i', char: '水' },
  { key: 'o', char: '火' },
  { key: 'p', char: '之' },
  { key: 'n', char: '已' },
  { key: 'b', char: '子' },
  { key: 'v', char: '女' },
  { key: 'c', char: '又' },
  { key: 'x', char: '纟' },
]

/** 每个键上的常用字根示例，用于字根关卡 */
export const WUBI_ROOTS: { key: string; roots: string[] }[] = [
  { key: 'g', roots: ['王', '一', '五', '戋'] },
  { key: 'f', roots: ['土', '士', '二', '干', '十'] },
  { key: 'd', roots: ['大', '犬', '三', '羊', '古'] },
  { key: 's', roots: ['木', '丁', '西'] },
  { key: 'a', roots: ['工', '七', '戈', '艹', '廿'] },
  { key: 'h', roots: ['目', '上', '止', '卜', '虎'] },
  { key: 'j', roots: ['日', '早', '虫', '曰'] },
  { key: 'k', roots: ['口', '川'] },
  { key: 'l', roots: ['田', '甲', '四', '车', '力'] },
  { key: 'm', roots: ['山', '由', '贝', '几', '冂'] },
  { key: 't', roots: ['禾', '竹', '丿', '攵', '彳'] },
  { key: 'r', roots: ['白', '手', '斤', '扌'] },
  { key: 'e', roots: ['月', '彡', '乃', '用', '衣'] },
  { key: 'w', roots: ['人', '八', '亻'] },
  { key: 'q', roots: ['金', '勺', '鱼', '犬', '儿'] },
  { key: 'y', roots: ['言', '文', '方', '广', '丶'] },
  { key: 'u', roots: ['立', '辛', '六', '门', '疒'] },
  { key: 'i', roots: ['水', '小', '氵'] },
  { key: 'o', roots: ['火', '米', '业', '灬'] },
  { key: 'p', roots: ['之', '宀', '辶', '礻', '衤'] },
  { key: 'n', roots: ['已', '己', '尸', '心', '羽'] },
  { key: 'b', roots: ['子', '耳', '了', '也', '凵'] },
  { key: 'v', roots: ['女', '刀', '九', '臼', '彐'] },
  { key: 'c', roots: ['又', '巴', '马', '厶'] },
  { key: 'x', roots: ['母', '弓', '匕', '幺', '纟'] },
]

export function wubiFull(char: string): string | undefined {
  return WUBI_DICT.chars[char]
}

function pad(code: string, length: number): string {
  if (code.length >= length) return code.slice(0, length)
  return code.padEnd(length, code[code.length - 1] ?? 'a')
}

/**
 * 按五笔 86 词组规则由单字全码计算词组编码：
 * 二字词：各取前两码；三字词：前两字各一码 + 第三字前两码；
 * 四字词：各取第一码；更多字：前三字各一码 + 末字一码。
 */
export function wubiWordCode(text: string): string | null {
  const chars = Array.from(text)
  if (chars.length === 0) return null
  const codes = chars.map((char) => WUBI_DICT.chars[char])
  if (codes.some((code) => !code)) return null

  if (chars.length === 1) return codes[0] ?? null
  if (chars.length === 2) {
    const [a, b] = codes as [string, string]
    return `${pad(a, 2)}${pad(b, 2)}`
  }
  if (chars.length === 3) {
    const [a, b, c] = codes as [string, string, string]
    return `${pad(a, 1)}${pad(b, 1)}${pad(c, 2)}`
  }
  if (chars.length === 4) {
    return codes.map((code) => pad(code as string, 1)).join('')
  }
  const first = codes.slice(0, 3).map((code) => pad(code as string, 1)).join('')
  const last = pad(codes[codes.length - 1] as string, 1)
  return `${first}${last}`
}

export interface WubiCoverage {
  ok: boolean
  missing: string[]
}

/** 检查文本中的汉字是否都在码表内 */
export function wubiCoverage(chars: string[]): WubiCoverage {
  const missing = [...new Set(chars.filter((char) => !WUBI_DICT.chars[char]))]
  return { ok: missing.length === 0, missing }
}

export const WUBI_META = WUBI_DICT.meta
