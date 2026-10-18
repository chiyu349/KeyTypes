export type InputMethod = 'pinyin' | 'wubi' | 'shuangpin'

export type ShuangpinSchemeId = 'xiaohe' | 'weiruan' | 'ziranma'

export type PracticeMode = 'timed' | 'passage'

export type TextSource = 'builtin' | 'custom'

export type ThemeMode = 'light' | 'dark'

export type CharStatus = 'pending' | 'correct' | 'wrong'

export type SessionPhase = 'idle' | 'running' | 'finished'

export type FinishReason = 'completed' | 'timeout' | 'aborted'

/** 一个可输入的片段：展示文字 + 需要敲出的字母码 */
export interface Segment {
  text: string
  code: string
}

/** 一道练习：一段展示文本及其分段编码 */
export interface ExerciseItem {
  id: string
  display: string
  segments: Segment[]
  /** 关卡内的补充说明，例如「一级简码」「键名字」 */
  tag?: string
}

export interface LevelDef {
  id: string
  method: InputMethod
  index: number
  title: string
  tagline: string
  description: string
  targetCpm: number
  itemCount: number
}

export interface LevelSnapshot {
  id: string
  title: string
  tagline: string
  targetCpm: number
}

export interface SessionResult {
  id: string
  method: InputMethod
  scheme: ShuangpinSchemeId | null
  levelId: string
  levelTitle: string
  mode: PracticeMode
  timeLimit: number | null
  durationMs: number
  cpm: number
  wpm: number
  accuracy: number
  errors: number
  totalKeystrokes: number
  correctChars: number
  stars: 0 | 1 | 2 | 3
  status: FinishReason
  finishedAt: number
}

export interface BestRecord {
  resultId: string
  cpm: number
  accuracy: number
  stars: 0 | 1 | 2 | 3
  finishedAt: number
}

export interface CustomText {
  id: string
  name: string
  text: string
  method: InputMethod
  createdAt: number
}

export interface SettingsState {
  version: 1
  theme: ThemeMode
  method: InputMethod
  scheme: ShuangpinSchemeId
  mode: PracticeMode
  timeLimit: 15 | 30 | 60
  stopOnError: boolean
  allowBackspace: boolean
  showKeyboard: boolean
  soundOn: boolean
  levelIndexByMethod: Record<InputMethod, number>
  textSource: TextSource
  activeCustomId: string | null
}

export interface ProgressData {
  version: 1
  results: SessionResult[]
  best: Record<string, BestRecord>
  updatedAt: number
}

export interface CustomData {
  version: 1
  items: CustomText[]
  updatedAt: number
}

export interface ExportBundle {
  app: 'jiandao-typing'
  version: 1
  exportedAt: string
  settings: SettingsState
  progress: ProgressData
  custom: CustomData
}

export const METHODS: { id: InputMethod; name: string; en: string; blurb: string }[] = [
  { id: 'pinyin', name: '拼音', en: 'Pinyin', blurb: '按音节逐字母输入，适合入门' },
  { id: 'wubi', name: '五笔', en: 'Wubi 86', blurb: '字根拆字，全码与简码分级' },
  { id: 'shuangpin', name: '双拼', en: 'Shuangpin', blurb: '声母 + 韵母两键，速度型方案' },
]

export function methodName(method: InputMethod): string {
  return METHODS.find((item) => item.id === method)?.name ?? method
}
