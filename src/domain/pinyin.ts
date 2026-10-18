import { pinyin } from 'pinyin-pro'
import type { Segment, ShuangpinSchemeId } from '@/types'
import { shuangpinCode } from './shuangpin'

const HANZI = /\p{Script=Han}/u

export function isHanzi(char: string): boolean {
  return HANZI.test(char)
}

export function hanziChars(text: string): string[] {
  return Array.from(text).filter(isHanzi)
}

export function nonHanziChars(text: string): string[] {
  return Array.from(text).filter((char) => !isHanzi(char) && !/\s/.test(char))
}

/** 汉字串 → 逐字无声调拼音，ü 统一写作 v */
export function syllablesOf(text: string): string[] {
  const chars = hanziChars(text)
  if (!chars.length) return []
  const result = pinyin(chars.join(''), {
    toneType: 'none',
    type: 'array',
    v: true,
    nonZh: 'removed',
  })
  const list = Array.isArray(result) ? result : [result]
  return list.map((item) => String(item).toLowerCase())
}

/** 汉字串 → 拼音或双拼分段（每个汉字一段） */
export function phoneticSegments(text: string, scheme?: ShuangpinSchemeId): Segment[] {
  const chars = hanziChars(text)
  const syllables = syllablesOf(text)
  return chars.map((char, index) => {
    const syllable = syllables[index] ?? char
    return {
      text: char,
      code: scheme ? shuangpinCode(syllable, scheme) : syllable,
    }
  })
}
