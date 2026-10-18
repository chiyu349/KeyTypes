export interface KeyCap {
  /** 键帽中央的主标签，例如五笔键名或双拼韵母 */
  primary: string
  /** 键帽下排的补充标签，例如字根串或特殊声母 */
  secondary?: string
  /** 右上角的辅助标记，例如五笔区位号 */
  tertiary?: string
  tone?: 'accent' | 'soft'
}

/** QWERTY 三行键位，第三行与第二行错位显示 */
export const KEYBOARD_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

export const KEYBOARD_KEY_ORDER: string[] = KEYBOARD_ROWS.flat()
