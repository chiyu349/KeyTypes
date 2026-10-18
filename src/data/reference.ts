import { SHUANGPIN_SCHEMES, getScheme, shuangpinCode } from '@/domain/shuangpin'
import { WUBI_DICT, WUBI_KEY_NAMES, WUBI_ROOTS } from '@/domain/wubi'
import type { ShuangpinSchemeId } from '@/types'
import type { KeyCap } from './keyboard'

/** 五笔 86 的区位号：横 11-15、竖 21-25、撇 31-35、捺 41-45、折 51-55 */
export const WUBI_ZONES: Record<string, string> = {
  g: '11',
  f: '12',
  d: '13',
  s: '14',
  a: '15',
  h: '21',
  j: '22',
  k: '23',
  l: '24',
  m: '25',
  t: '31',
  r: '32',
  e: '33',
  w: '34',
  q: '35',
  y: '41',
  u: '42',
  i: '43',
  o: '44',
  p: '45',
  n: '51',
  b: '52',
  v: '53',
  c: '54',
  x: '55',
}

/** 五笔 86 键位助记词（传统字根口诀） */
export const WUBI_MNEMONICS: Record<string, string> = {
  g: '王旁青头戋五一',
  f: '土士二干十寸雨',
  d: '大犬三羊古石厂',
  s: '木丁西',
  a: '工戈草头右框七',
  h: '目具上止卜虎皮',
  j: '日早两竖与虫依',
  k: '口与川，字根稀',
  l: '田甲方框四车力',
  m: '山由贝，下框几',
  t: '禾竹一撇双人立，反文条头共三一',
  r: '白手看头三二斤',
  e: '月彡乃用家衣底',
  w: '人和八，三四里',
  q: '金勺缺点无尾鱼，犬旁留叉儿一点夕，氏无七',
  y: '言文方广在四一，高头一捺谁人去',
  u: '立辛两点六门疒',
  i: '水旁兴头小倒立',
  o: '火业头，四点米',
  p: '之宝盖，摘礻衤',
  n: '已半巳满不出己，左框折尸心和羽',
  b: '子耳了也框向上',
  v: '女刀九臼山朝西',
  c: '又巴马，丢矢矣',
  x: '慈母无心弓和匕，幼无力',
}

const ROOTS_BY_KEY: Record<string, string[]> = Object.fromEntries(
  WUBI_ROOTS.map((item) => [item.key, item.roots]),
)

export function buildWubiKeyCaps(): Record<string, KeyCap> {
  const caps: Record<string, KeyCap> = {}
  for (const { key, char } of WUBI_KEY_NAMES) {
    caps[key] = {
      primary: char,
      secondary: (ROOTS_BY_KEY[key] ?? []).join(''),
      tertiary: WUBI_ZONES[key],
    }
  }
  return caps
}

export const WUBI_MNEMONIC_LIST: { key: string; text: string }[] = WUBI_KEY_NAMES.map(
  ({ key }) => ({ key, text: WUBI_MNEMONICS[key] ?? '' }),
)

const WUBI_KEY_ORDER = WUBI_KEY_NAMES.map((item) => item.key)

/** 一级简码：键位 → 汉字 */
export const WUBI_LEVEL1: { key: string; char: string }[] = Object.entries(WUBI_DICT.level1)
  .map(([char, key]) => ({ key, char }))
  .sort((a, b) => WUBI_KEY_ORDER.indexOf(a.key) - WUBI_KEY_ORDER.indexOf(b.key))

const FINAL_DISPLAY: Record<string, string> = {
  v: 'ü',
  ve: 'üe',
}

const FINAL_ORDER = [
  'a', 'o', 'e', 'i', 'u', 'ü',
  'ai', 'ei', 'ao', 'ou',
  'an', 'en', 'ang', 'eng', 'er',
  'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong',
  'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ong', 'üe',
]

/** 双拼键位图：每个键上承载的韵母，以及 zh/ch/sh 特殊声母 */
export function buildShuangpinKeyCaps(schemeId: ShuangpinSchemeId): Record<string, KeyCap> {
  const scheme = getScheme(schemeId)
  const grouped: Record<string, string[]> = {}

  for (const [final, key] of Object.entries(scheme.finals)) {
    const display = FINAL_DISPLAY[final] ?? final
    const list = grouped[key] ?? []
    if (!list.includes(display)) list.push(display)
    grouped[key] = list
  }

  const specialInitials: Record<string, string> = { v: 'zh', i: 'ch', u: 'sh' }
  const caps: Record<string, KeyCap> = {}

  for (const [key, list] of Object.entries(grouped)) {
    list.sort((a, b) => {
      const indexA = FINAL_ORDER.indexOf(a)
      const indexB = FINAL_ORDER.indexOf(b)
      return (indexA < 0 ? 99 : indexA) - (indexB < 0 ? 99 : indexB)
    })
    caps[key] = {
      primary: list.join(' / '),
      secondary: specialInitials[key],
    }
  }

  return caps
}

/** 零声母音节的写法：小鹤/自然码重复韵母首字母，微软统一加 o */
const ZERO_SAMPLES: { label: string; syllable: string }[] = [
  { label: '啊', syllable: 'a' },
  { label: '哦', syllable: 'o' },
  { label: '鹅', syllable: 'e' },
  { label: '爱', syllable: 'ai' },
  { label: '安', syllable: 'an' },
  { label: '昂', syllable: 'ang' },
  { label: '恩', syllable: 'en' },
  { label: '欧', syllable: 'ou' },
  { label: '儿', syllable: 'er' },
]

export const ZERO_INITIAL_ROWS = ZERO_SAMPLES.map((sample) => ({
  label: sample.label,
  syllable: sample.syllable,
  xiaohe: shuangpinCode(sample.syllable, 'xiaohe'),
  weiruan: shuangpinCode(sample.syllable, 'weiruan'),
  ziranma: shuangpinCode(sample.syllable, 'ziranma'),
}))

interface CompareFinal {
  label: string
  final: string
}

const VOWEL_FINALS: CompareFinal[] = [
  { label: 'a', final: 'a' },
  { label: 'o', final: 'o' },
  { label: 'e', final: 'e' },
  { label: 'i', final: 'i' },
  { label: 'u', final: 'u' },
  { label: 'ü', final: 'v' },
  { label: 'ai', final: 'ai' },
  { label: 'ei', final: 'ei' },
  { label: 'ao', final: 'ao' },
  { label: 'ou', final: 'ou' },
  { label: 'ia', final: 'ia' },
  { label: 'ie', final: 'ie' },
  { label: 'iao', final: 'iao' },
  { label: 'iu', final: 'iu' },
  { label: 'ua', final: 'ua' },
  { label: 'uo', final: 'uo' },
  { label: 'uai', final: 'uai' },
  { label: 'ui', final: 'ui' },
  { label: 'üe', final: 'ue' },
  { label: 'er', final: 'er' },
]

const NASAL_FINALS: CompareFinal[] = [
  { label: 'an', final: 'an' },
  { label: 'en', final: 'en' },
  { label: 'ang', final: 'ang' },
  { label: 'eng', final: 'eng' },
  { label: 'ian', final: 'ian' },
  { label: 'in', final: 'in' },
  { label: 'iang', final: 'iang' },
  { label: 'ing', final: 'ing' },
  { label: 'iong', final: 'iong' },
  { label: 'uan', final: 'uan' },
  { label: 'un', final: 'un' },
  { label: 'uang', final: 'uang' },
  { label: 'ong', final: 'ong' },
]

function compareRow(row: CompareFinal) {
  return {
    label: row.label,
    xiaohe: SHUANGPIN_SCHEMES.xiaohe.finals[row.final] ?? '—',
    weiruan: SHUANGPIN_SCHEMES.weiruan.finals[row.final] ?? '—',
    ziranma: SHUANGPIN_SCHEMES.ziranma.finals[row.final] ?? '—',
  }
}

export const FINAL_COMPARE_GROUPS: { title: string; rows: ReturnType<typeof compareRow>[] }[] = [
  { title: '单韵母与复韵母', rows: VOWEL_FINALS.map(compareRow) },
  { title: '鼻韵母', rows: NASAL_FINALS.map(compareRow) },
]

export interface SchemeGuide {
  tips: string[]
  examples: { text: string; code: string }[]
}

const SCHEME_TIPS: Record<ShuangpinSchemeId, string[]> = {
  xiaohe: [
    '韵母主要集中在键盘上排与中排：q=iu、w=ei、p=ie、m=ian、n=iao，先记这五个高频键。',
    '成对记忆同键双韵母：k=ing/uai、l=iang/uang、x=ia/ua、s=ong/iong、o=o/uo。',
    '零声母重复韵母首字母：爱 ad、安 aj、昂 ah、儿 er、啊 aa。',
    'zh/ch/sh 分别落在 V/I/U；ü 与 ui 共用 V 键（女 nv、对 dv）。',
    '建议顺序：两键音节 → 高频单字 → 双字词 → 短句，先准确再提速。',
  ],
  weiruan: [
    '零声母统一加 o：啊 oa、爱 ol、安 oj、昂 oh、儿 or，这是与另外两套方案最明显的区别。',
    'ing 使用分号键：星 x;、应 y;，键盘提示会在微软方案下显示分号。',
    'ü 与 uai 共用 Y 键：女 ny、快 ky；ui 在 V 键。',
    'zh/ch/sh 分别落在 V/I/U；其余声母与字母键相同。',
    '先记住 o 前缀和分号键，再按上排、中排顺序记韵母。',
  ],
  ziranma: [
    '韵母分布较均匀：q=iu、w=ia/ua、r=uan、t=üe、y=ing/uai、p=un。',
    '零声母重复韵母首字母：爱 al、安 aj、昂 ah、儿 er、欧 ob。',
    'zh/ch/sh 分别落在 V/I/U；ü 与 ui 都在 V 键（女 nv、对 dv）。',
    '与微软的区别：ing 在 Y 键而不是分号，ei 在 Z 键。',
    '键位接近全拼习惯，适合从全拼迁移；先把 an/ang、in/ing 分清。',
  ],
}

const GUIDE_EXAMPLES: { text: string; syllable: string }[] = [
  { text: '中', syllable: 'zhong' },
  { text: '双', syllable: 'shuang' },
  { text: '学', syllable: 'xue' },
  { text: '天', syllable: 'tian' },
  { text: '星', syllable: 'xing' },
  { text: '爱', syllable: 'ai' },
]

export function getSchemeGuide(schemeId: ShuangpinSchemeId): SchemeGuide {
  return {
    tips: SCHEME_TIPS[schemeId] ?? [],
    examples: GUIDE_EXAMPLES.map((item) => ({
      text: item.text,
      code: shuangpinCode(item.syllable, schemeId),
    })),
  }
}
