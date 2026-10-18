import { COMMON_CHARS, PASSAGES, PHRASES, SENTENCES, WORDS } from '@/data/corpus'
import { phoneticSegments, syllablesOf } from '@/domain/pinyin'
import { WUBI_DICT, WUBI_KEY_NAMES, WUBI_ROOTS, wubiFull, wubiWordCode } from '@/domain/wubi'
import type { ExerciseItem, InputMethod, LevelDef, ShuangpinSchemeId } from '@/types'

const COMMON = [...new Set(Array.from(COMMON_CHARS))]

function makeTextItem(text: string, scheme: ShuangpinSchemeId | undefined, tag?: string): ExerciseItem {
  return {
    id: `text-${tag ?? 'plain'}-${text}`,
    display: text,
    tag,
    segments: phoneticSegments(text, scheme),
  }
}

function makeSingleCharItem(char: string, scheme: ShuangpinSchemeId | undefined, tag?: string): ExerciseItem {
  return {
    id: `char-${tag ?? 'plain'}-${char}`,
    display: char,
    tag,
    segments: phoneticSegments(char, scheme),
  }
}

/** 覆盖尽量多不同音节的单字池，供拼音/双拼的入门关卡使用 */
let syllablePoolCache: string[] | null = null

function syllablePickedChars(): string[] {
  if (syllablePoolCache) return syllablePoolCache
  const seen = new Set<string>()
  const picked: string[] = []
  for (const char of COMMON) {
    const syllable = syllablesOf(char)[0]
    if (!syllable || seen.has(syllable)) continue
    seen.add(syllable)
    picked.push(char)
  }
  syllablePoolCache = picked
  return picked
}

function pinyinLevelItems(index: number, scheme?: ShuangpinSchemeId): ExerciseItem[] {
  const syllablePool = syllablePickedChars()
  switch (index) {
    case 0: {
      const count = scheme ? 60 : 120
      return syllablePool.slice(0, count).map((char) => makeSingleCharItem(char, scheme, '单音节'))
    }
    case 1: {
      const count = scheme ? 60 : 80
      const used = new Set(syllablePool.slice(0, scheme ? 60 : 120))
      const rest = COMMON.filter((char) => !used.has(char)).slice(0, count)
      return rest.map((char) => makeSingleCharItem(char, scheme, '常用单字'))
    }
    case 2: {
      const count = scheme ? 60 : 90
      return WORDS.slice(0, count).map((word) => makeTextItem(word, scheme, '双字词'))
    }
    case 3: {
      const count = scheme ? 50 : 70
      return PHRASES.slice(0, count).map((word) => makeTextItem(word, scheme, '短语'))
    }
    case 4: {
      const count = scheme ? 30 : 40
      return SENTENCES.slice(0, count).map((word) => makeTextItem(word, scheme, '短句'))
    }
    case 5: {
      const count = scheme ? 12 : 15
      return PASSAGES.slice(0, count).map((word) => makeTextItem(word, scheme, '段落'))
    }
    default:
      return []
  }
}

function wubiLevelItems(index: number): ExerciseItem[] {
  switch (index) {
    case 0: {
      const levelOne = Object.entries(WUBI_DICT.level1)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([char, code]) => ({
          id: `wubi-l1-${char}`,
          display: char,
          tag: '一级简码',
          segments: [{ text: char, code }],
        }))
      const keyNames = WUBI_KEY_NAMES.map(({ key, char }) => ({
        id: `wubi-key-${key}`,
        display: char,
        tag: '键名字',
        segments: [{ text: char, code: key.repeat(4) }],
      }))
      return [...levelOne, ...keyNames]
    }
    case 1: {
      const items: ExerciseItem[] = []
      for (const { key, roots } of WUBI_ROOTS) {
        for (const root of roots) {
          items.push({
            id: `wubi-root-${key}-${root}`,
            display: root,
            tag: `${key.toUpperCase()} 键字根`,
            segments: [{ text: root, code: key }],
          })
        }
      }
      return items
    }
    case 2: {
      const picked = COMMON.filter((char) => WUBI_DICT.level2[char]).slice(0, 120)
      return picked.map((char) => ({
        id: `wubi-l2-${char}`,
        display: char,
        tag: '二级简码',
        segments: [{ text: char, code: WUBI_DICT.level2[char] as string }],
      }))
    }
    case 3: {
      const used = new Set(COMMON.filter((char) => WUBI_DICT.level2[char]).slice(0, 120))
      const candidates = COMMON.filter((char) => !used.has(char) && wubiFull(char))
      const picked = candidates.slice(0, 150)
      return picked.map((char) => ({
        id: `wubi-full-${char}`,
        display: char,
        tag: '全码',
        segments: [{ text: char, code: wubiFull(char) as string }],
      }))
    }
    case 4: {
      const items: ExerciseItem[] = []
      for (const word of WORDS) {
        const code = wubiWordCode(word)
        if (!code) continue
        items.push({
          id: `wubi-word-${word}`,
          display: word,
          tag: '词组',
          segments: [{ text: word, code }],
        })
        if (items.length >= 100) break
      }
      return items
    }
    case 5: {
      return PASSAGES.map((passage, index) => {
        const segments = Array.from(passage).map((char) => ({
          text: char,
          code: wubiFull(char) ?? '',
        }))
        return {
          id: `wubi-passage-${index}`,
          display: passage,
          tag: '短文',
          segments: segments.filter((segment) => segment.code.length > 0),
        }
      }).slice(0, 15)
    }
    default:
      return []
  }
}

interface LevelSeed {
  title: string
  tagline: string
  description: string
  targetCpm: number
  itemCount: number
}

const PINYIN_SEEDS: LevelSeed[] = [
  {
    title: '音节入门',
    tagline: '单字 · 声母韵母',
    description: '按无声调拼音逐字输入，先把 23 个声母和 24 个韵母的键位敲顺。',
    targetCpm: 60,
    itemCount: 120,
  },
  {
    title: '常用单字',
    tagline: '高频字 · 音节',
    description: '换成频率更高的汉字，练习连续音节的切换，减少找键停顿。',
    targetCpm: 65,
    itemCount: 80,
  },
  {
    title: '常用词语',
    tagline: '双字词 · 节奏',
    description: '两字词语按音节依次输入，训练词内衔接与稳定节奏。',
    targetCpm: 70,
    itemCount: 90,
  },
  {
    title: '短语进阶',
    tagline: '三到四字 · 连贯',
    description: '三到四字短语，要求连续多个音节不断拍。',
    targetCpm: 75,
    itemCount: 70,
  },
  {
    title: '短句练习',
    tagline: '整句 · 耐力',
    description: '整句连续输入，贴近真实聊天与写作场景。',
    targetCpm: 75,
    itemCount: 40,
  },
  {
    title: '段落长文',
    tagline: '段落 · 综合',
    description: '完整段落，综合考察速度、准确率与长时间专注。',
    targetCpm: 70,
    itemCount: 15,
  },
]

const SHUANGPIN_SEEDS: LevelSeed[] = [
  {
    title: '两键音节',
    tagline: '单音节 · 键位',
    description: '每个音节两声母韵母两键，先建立「一音两键」的反射。',
    targetCpm: 70,
    itemCount: 60,
  },
  {
    title: '常用单字',
    tagline: '高频字 · 两键',
    description: '用高频字巩固韵母键位，尤其是容易混淆的 an/ang 与 in/ing。',
    targetCpm: 80,
    itemCount: 60,
  },
  {
    title: '常用词语',
    tagline: '双字词 · 连击',
    description: '双字词连续四键，练习声母与韵母之间的无缝切换。',
    targetCpm: 85,
    itemCount: 60,
  },
  {
    title: '短语进阶',
    tagline: '三到四字 · 节奏',
    description: '短语输入讲究匀速，避免因某个韵母键犹豫而断流。',
    targetCpm: 90,
    itemCount: 50,
  },
  {
    title: '短句练习',
    tagline: '整句 · 稳定',
    description: '整句输入，保持准确率的前提下逐步提速。',
    targetCpm: 90,
    itemCount: 30,
  },
  {
    title: '段落长文',
    tagline: '段落 · 综合',
    description: '长段落综合练习，检验双拼是否已经形成肌肉记忆。',
    targetCpm: 85,
    itemCount: 12,
  },
]

const WUBI_SEEDS: LevelSeed[] = [
  {
    title: '键名与一级简码',
    tagline: '25 键 · 单键出字',
    description: '25 个一级简码一个字一码，键名字按四连击输入，先熟悉主键位。',
    targetCpm: 60,
    itemCount: 50,
  },
  {
    title: '字根与键位',
    tagline: '25 键 · 字根',
    description: '按字根所在键位单键练习，把字根和键位对应关系记牢。',
    targetCpm: 60,
    itemCount: 111,
  },
  {
    title: '二级简码',
    tagline: '常用字 · 两码',
    description: '常用字的两码简码，兼顾常用度与击键经济性。',
    targetCpm: 70,
    itemCount: 120,
  },
  {
    title: '常用字全码',
    tagline: '单字 · 全码',
    description: '完整拆字输入，练习末笔识别与全码准确度。',
    targetCpm: 65,
    itemCount: 150,
  },
  {
    title: '常用词组',
    tagline: '词语 · 四码',
    description: '按五笔词组规则输入双字词，四码完成一个词。',
    targetCpm: 70,
    itemCount: 100,
  },
  {
    title: '短文全码',
    tagline: '段落 · 全码',
    description: '段落逐字全码输入，检验字根、拆字与指法的综合能力。',
    targetCpm: 60,
    itemCount: 15,
  },
]

function buildLevels(method: InputMethod, seeds: LevelSeed[]): LevelDef[] {
  return seeds.map((seed, index) => ({
    id: `${method}-${index + 1}`,
    method,
    index,
    title: seed.title,
    tagline: seed.tagline,
    description: seed.description,
    targetCpm: seed.targetCpm,
    itemCount: seed.itemCount,
  }))
}

export const LEVELS: Record<InputMethod, LevelDef[]> = {
  pinyin: buildLevels('pinyin', PINYIN_SEEDS),
  wubi: buildLevels('wubi', WUBI_SEEDS),
  shuangpin: buildLevels('shuangpin', SHUANGPIN_SEEDS),
}

const cache = new Map<string, ExerciseItem[]>()

export function getLevelItems(
  method: InputMethod,
  index: number,
  scheme: ShuangpinSchemeId,
): ExerciseItem[] {
  const safeIndex = Math.min(Math.max(index, 0), LEVELS[method].length - 1)
  const key = `${method}:${safeIndex}:${method === 'shuangpin' ? scheme : 'none'}`
  const cached = cache.get(key)
  if (cached) return cached

  const items =
    method === 'wubi'
      ? wubiLevelItems(safeIndex)
      : pinyinLevelItems(safeIndex, method === 'shuangpin' ? scheme : undefined)
  cache.set(key, items)
  return items
}

export function getLevel(method: InputMethod, index: number): LevelDef {
  const list = LEVELS[method]
  return list[Math.min(Math.max(index, 0), list.length - 1)] as LevelDef
}

export function levelKey(
  method: InputMethod,
  scheme: string | null,
  levelId: string,
  mode: string,
): string {
  return `${method}:${scheme ?? '-'}:${levelId}:${mode}`
}
