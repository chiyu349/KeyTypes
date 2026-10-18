import type { CharStatus, ExerciseItem, Segment } from '@/types'

export interface EngineOptions {
  stopOnError: boolean
  allowBackspace: boolean
  finishOnExhaust: boolean
  allowedKeys?: RegExp
}

export interface CharView {
  ch: string
  status: CharStatus
}

export interface SegmentView {
  index: number
  start: number
  text: string
  code: string
  tag?: string
  chars: CharView[]
  active: boolean
  done: boolean
}

export interface EngineStats {
  correctChars: number
  correctKeystrokes: number
  wrongKeystrokes: number
  totalKeystrokes: number
  accuracy: number
  totalChars: number
  cursor: number
  remaining: number
}

export interface EngineSnapshot extends EngineStats {
  segments: SegmentView[]
  activeSegIndex: number
  activeCharIndex: number
  nextKey: string | null
  activeLabel: string | null
  finished: boolean
}

export interface PressOutcome {
  typed: boolean
  correct: boolean
  finished: boolean
}

interface Cell {
  ch: string
  status: CharStatus
  seg: number
}

interface SegmentRecord {
  text: string
  code: string
  tag?: string
  start: number
}

/**
 * 逐键判定内核：把练习文本摊平成字符队列，逐字比对。
 * 拼音/双拼的每个汉字是一段，五笔的每个词或字是一段；
 * 段与段之间不需要敲分隔符，段内字符全部正确后自动进入下一段。
 */
export class TypingEngine {
  private cells: Cell[] = []
  private segments: SegmentRecord[] = []
  private cursor = 0
  private correctKeystrokes = 0
  private wrongKeystrokes = 0
  private correctChars = 0
  private finished = false

  private readonly options: EngineOptions & { allowedKeys: RegExp }

  constructor(options: EngineOptions) {
    this.options = {
      ...options,
      allowedKeys: options.allowedKeys ?? /^[a-z]$/,
    }
  }

  reset(): void {
    this.cells = []
    this.segments = []
    this.cursor = 0
    this.correctKeystrokes = 0
    this.wrongKeystrokes = 0
    this.correctChars = 0
    this.finished = false
  }

  pushItem(item: ExerciseItem): void {
    if (this.finished) return
    for (const segment of item.segments) {
      if (!segment.code) continue
      this.pushSegment(segment, item.tag)
    }
  }

  private pushSegment(segment: Segment, tag?: string): void {
    const segIndex = this.segments.length
    const start = this.cells.length
    this.segments.push({ text: segment.text, code: segment.code, tag, start })
    for (const ch of segment.code) {
      this.cells.push({ ch, status: 'pending', seg: segIndex })
    }
  }

  get totalChars(): number {
    return this.cells.length
  }

  get remaining(): number {
    return this.cells.length - this.cursor
  }

  press(rawKey: string): PressOutcome {
    const key = rawKey.toLowerCase()
    if (this.finished || this.cursor >= this.cells.length || !this.options.allowedKeys.test(key)) {
      return { typed: false, correct: false, finished: this.finished }
    }

    const cell = this.cells[this.cursor]
    if (!cell) return { typed: false, correct: false, finished: this.finished }

    if (cell.ch === key) {
      this.markCorrect(cell)
      this.correctKeystrokes += 1
      this.cursor += 1
      this.finishIfNeeded()
      return { typed: true, correct: true, finished: this.finished }
    }

    this.wrongKeystrokes += 1
    if (!this.options.stopOnError) {
      cell.status = 'wrong'
      this.cursor += 1
      this.finishIfNeeded()
    }
    return { typed: true, correct: false, finished: this.finished }
  }

  private markCorrect(cell: Cell): void {
    if (cell.status !== 'correct') {
      cell.status = 'correct'
      this.correctChars += 1
    }
  }

  private finishIfNeeded(): void {
    if (this.cursor >= this.cells.length && this.options.finishOnExhaust) {
      this.finished = true
    }
  }

  backspace(): boolean {
    if (this.finished || !this.options.allowBackspace || this.cursor === 0) return false
    this.cursor -= 1
    const cell = this.cells[this.cursor]
    if (!cell) return false
    if (cell.status === 'correct') this.correctChars = Math.max(0, this.correctChars - 1)
    cell.status = 'pending'
    return true
  }

  get accuracy(): number {
    const total = this.correctKeystrokes + this.wrongKeystrokes
    return total === 0 ? 100 : (this.correctKeystrokes / total) * 100
  }

  snapshot(): EngineSnapshot {
    const totalChars = this.cells.length
    const activeSegIndex =
      totalChars === 0
        ? -1
        : this.cursor < totalChars
          ? (this.cells[this.cursor]?.seg ?? this.segments.length - 1)
          : this.segments.length - 1
    const activeRecord = this.segments[activeSegIndex]
    const activeCharIndex = activeRecord ? Math.max(0, this.cursor - activeRecord.start) : 0

    const segments: SegmentView[] = this.segments.map((record, index) => {
      const end = record.start + record.code.length
      const chars = this.cells.slice(record.start, end).map((cell) => ({
        ch: cell.ch,
        status: cell.status,
      }))
      return {
        index,
        start: record.start,
        text: record.text,
        code: record.code,
        tag: record.tag,
        chars,
        active: index === activeSegIndex && this.cursor < totalChars,
        done: this.cursor >= end,
      }
    })

    const total = this.correctKeystrokes + this.wrongKeystrokes
    return {
      segments,
      activeSegIndex,
      activeCharIndex,
      nextKey: this.cursor < totalChars ? (this.cells[this.cursor]?.ch ?? null) : null,
      activeLabel: activeRecord?.text ?? null,
      finished: this.finished,
      correctChars: this.correctChars,
      correctKeystrokes: this.correctKeystrokes,
      wrongKeystrokes: this.wrongKeystrokes,
      totalKeystrokes: total,
      accuracy: this.accuracy,
      totalChars,
      cursor: this.cursor,
      remaining: totalChars - this.cursor,
    }
  }
}
