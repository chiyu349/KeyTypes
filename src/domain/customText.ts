import type { ExerciseItem, InputMethod, ShuangpinSchemeId } from '@/types'
import { hanziChars, phoneticSegments } from './pinyin'
import { WUBI_DICT } from './wubi'

export interface CustomTextCheck {
  ok: boolean
  chars: number
  missing: string[]
  issues: string[]
  preview: string
}

const ALLOWED_PUNCTUATION = /^[\s，。！？、；：""''（）《》〈〉【】…—·,.!?;:'"()<>[\]{}\-~～]$/
const CHUNK_SIZE = 28
const MIN_CHARS = 5

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export function checkCustomText(text: string, method: InputMethod): CustomTextCheck {
  const chars = hanziChars(text)
  const issues: string[] = []

  if (chars.length < MIN_CHARS) {
    issues.push(`至少需要 ${MIN_CHARS} 个汉字，当前 ${chars.length} 个`)
  }

  const unsupported = unique(
    Array.from(text).filter((char) => !/[\u4e00-\u9fff]/.test(char) && !ALLOWED_PUNCTUATION.test(char)),
  )
  if (unsupported.length) {
    issues.push(`不支持这些字符：${unsupported.slice(0, 12).join(' ')}${unsupported.length > 12 ? ' …' : ''}`)
  }

  let missing: string[] = []
  if (method === 'wubi') {
    missing = unique(chars.filter((char) => !WUBI_DICT.chars[char]))
    if (missing.length) {
      issues.push(`五笔码表未收录：${missing.slice(0, 12).join(' ')}${missing.length > 12 ? ' …' : ''}`)
    }
  }

  return {
    ok: issues.length === 0,
    chars: chars.length,
    missing,
    issues,
    preview: chars.slice(0, 32).join(''),
  }
}

/**
 * 把自定义文本切成若干题，每题最多 28 个汉字。
 * 拼音/双拼按汉字逐字生成音节码，五笔按全码生成。
 */
export function buildCustomItems(
  text: string,
  method: InputMethod,
  scheme: ShuangpinSchemeId,
  name: string,
): ExerciseItem[] {
  const chars = hanziChars(text)
  const chunks: string[][] = []
  for (let index = 0; index < chars.length; index += CHUNK_SIZE) {
    chunks.push(chars.slice(index, index + CHUNK_SIZE))
  }

  return chunks.map((chunk, index) => {
    const display = chunk.join('')
    const segments =
      method === 'wubi'
        ? chunk.map((char) => ({ text: char, code: WUBI_DICT.chars[char] ?? '' }))
        : phoneticSegments(display, method === 'shuangpin' ? scheme : undefined)

    return {
      id: `custom-${index}`,
      display,
      tag: index === 0 ? name : undefined,
      segments: segments.filter((segment) => segment.code.length > 0),
    }
  })
}
