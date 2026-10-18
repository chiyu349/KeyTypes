import type { ShuangpinSchemeId } from '@/types'

export interface ShuangpinScheme {
  id: ShuangpinSchemeId
  name: string
  shortName: string
  description: string
  /** 除 a-z 外还需要判定的键，例如微软双拼用分号表示 ing */
  extraKeys: string[]
  /** 零声母规则：重复韵母首字母，或统一加 o */
  zero: 'vowel' | 'o'
  initials: Record<string, string>
  finals: Record<string, string>
}

const SHARED_INITIALS: Record<string, string> = {
  b: 'b',
  p: 'p',
  m: 'm',
  f: 'f',
  d: 'd',
  t: 't',
  n: 'n',
  l: 'l',
  g: 'g',
  k: 'k',
  h: 'h',
  j: 'j',
  q: 'q',
  x: 'x',
  zh: 'v',
  ch: 'i',
  sh: 'u',
  r: 'r',
  z: 'z',
  c: 'c',
  s: 's',
  y: 'y',
  w: 'w',
}

/**
 * 三套方案均按「声母键 + 韵母键」两键成码。
 * 韵母表对照 Rime 双拼方案的 algebra 规则逐项核对：
 * 小鹤 rime-double-pinyin/double_pinyin_flypy.schema.yaml
 * 自然码 rime-double-pinyin/double_pinyin.schema.yaml
 * 微软 rime-double-pinyin/double_pinyin_mspy.schema.yaml
 */
export const SHUANGPIN_SCHEMES: Record<ShuangpinSchemeId, ShuangpinScheme> = {
  xiaohe: {
    id: 'xiaohe',
    name: '小鹤双拼',
    shortName: '小鹤',
    description: '最主流的双拼方案，键位清晰，示例：中 → vs，双 → ul',
    extraKeys: [],
    zero: 'vowel',
    initials: SHARED_INITIALS,
    finals: {
      a: 'a',
      o: 'o',
      e: 'e',
      i: 'i',
      u: 'u',
      v: 'v',
      ai: 'd',
      ei: 'w',
      ao: 'c',
      ou: 'z',
      an: 'j',
      en: 'f',
      ang: 'h',
      eng: 'g',
      er: 'r',
      ia: 'x',
      ie: 'p',
      iao: 'n',
      iu: 'q',
      ian: 'm',
      in: 'b',
      iang: 'l',
      ing: 'k',
      iong: 's',
      ua: 'x',
      uo: 'o',
      uai: 'k',
      ui: 'v',
      uan: 'r',
      un: 'y',
      uang: 'l',
      ong: 's',
      ue: 't',
      ve: 't',
    },
  },
  weiruan: {
    id: 'weiruan',
    name: '微软双拼',
    shortName: '微软',
    description: 'Windows 自带方案，零声母加 o，ing 使用分号键：中 → vs，星 → x;',
    extraKeys: [';'],
    zero: 'o',
    initials: SHARED_INITIALS,
    finals: {
      a: 'a',
      o: 'o',
      e: 'e',
      i: 'i',
      u: 'u',
      v: 'y',
      ai: 'l',
      ei: 'z',
      ao: 'k',
      ou: 'b',
      an: 'j',
      en: 'f',
      ang: 'h',
      eng: 'g',
      er: 'r',
      ia: 'w',
      ie: 'x',
      iao: 'c',
      iu: 'q',
      ian: 'm',
      in: 'n',
      iang: 'd',
      ing: ';',
      iong: 's',
      ua: 'w',
      uo: 'o',
      uai: 'y',
      ui: 'v',
      uan: 'r',
      un: 'p',
      uang: 'd',
      ong: 's',
      ue: 't',
      ve: 't',
    },
  },
  ziranma: {
    id: 'ziranma',
    name: '自然码双拼',
    shortName: '自然码',
    description: '经典自然码键位：中 → vs，双 → ud，爱 → al',
    extraKeys: [],
    zero: 'vowel',
    initials: SHARED_INITIALS,
    finals: {
      a: 'a',
      o: 'o',
      e: 'e',
      i: 'i',
      u: 'u',
      v: 'v',
      ai: 'l',
      ei: 'z',
      ao: 'k',
      ou: 'b',
      an: 'j',
      en: 'f',
      ang: 'h',
      eng: 'g',
      er: 'r',
      ia: 'w',
      ie: 'x',
      iao: 'c',
      iu: 'q',
      ian: 'm',
      in: 'n',
      iang: 'd',
      ing: 'y',
      iong: 's',
      ua: 'w',
      uo: 'o',
      uai: 'y',
      ui: 'v',
      uan: 'r',
      un: 'p',
      uang: 'd',
      ong: 's',
      ue: 't',
      ve: 't',
    },
  },
}

const INITIAL_KEYS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']

export function getScheme(id: ShuangpinSchemeId): ShuangpinScheme {
  return SHUANGPIN_SCHEMES[id] ?? SHUANGPIN_SCHEMES.xiaohe
}

export function splitSyllable(syllable: string): { initial: string; final: string } {
  const value = syllable.toLowerCase()
  for (const initial of INITIAL_KEYS) {
    if (value.startsWith(initial)) {
      return { initial, final: value.slice(initial.length) }
    }
  }
  return { initial: '', final: value }
}

/** 声母键位；j/q/x/y 后的 u 实际是 ü，按 v 处理 */
export function initialKey(initial: string, scheme: ShuangpinScheme): string {
  return scheme.initials[initial] ?? initial[0] ?? ''
}

export function finalKey(final: string, scheme: ShuangpinScheme): string {
  return scheme.finals[final] ?? final[0] ?? ''
}

function normalizeCode(code: string): string {
  if (code.length === 2) return code
  if (code.length > 2) return code.slice(0, 2)
  const filler = code[code.length - 1] ?? code[0] ?? 'a'
  return code.padEnd(2, filler)
}

export function shuangpinCode(syllable: string, schemeId: ShuangpinSchemeId): string {
  const scheme = getScheme(schemeId)
  const clean = syllable.toLowerCase().trim()
  if (!clean) return ''

  const { initial, final } = splitSyllable(clean)
  if (!initial) {
    const zeroKey = finalKey(final, scheme)
    return normalizeCode(scheme.zero === 'o' ? `o${zeroKey}` : `${final[0] ?? ''}${zeroKey}`)
  }

  let normalFinal = final
  if (/^[jqxy]$/.test(initial) && normalFinal === 'u') normalFinal = 'v'

  return normalizeCode(`${initialKey(initial, scheme)}${finalKey(normalFinal, scheme)}`)
}

/** 方案示例，用于界面说明 */
export function schemeSamples(schemeId: ShuangpinSchemeId): { text: string; code: string }[] {
  return [
    { text: '中', code: shuangpinCode('zhong', schemeId) },
    { text: '双', code: shuangpinCode('shuang', schemeId) },
    { text: '爱', code: shuangpinCode('ai', schemeId) },
  ]
}

export function allowedKeysFor(schemeId: ShuangpinSchemeId): RegExp {
  const scheme = getScheme(schemeId)
  return scheme.extraKeys.length ? new RegExp(`^[a-z${scheme.extraKeys.join('')}]$`) : /^[a-z]$/
}
