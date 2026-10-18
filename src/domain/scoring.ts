import type { SessionResult } from '@/types'

export function starsFor(cpm: number, accuracy: number, targetCpm: number): 0 | 1 | 2 | 3 {
  if (accuracy >= 97 && cpm >= targetCpm) return 3
  if (accuracy >= 93 && cpm >= Math.round(targetCpm * 0.8)) return 2
  return 1
}

export function wpmOf(cpm: number): number {
  return Math.round(cpm / 5)
}

export function rateLabel(stars: number): string {
  if (stars >= 3) return '行云流水'
  if (stars === 2) return '渐入佳境'
  if (stars === 1) return '稳扎稳打'
  return '继续练习'
}

export function isBetter(
  candidate: Pick<SessionResult, 'cpm' | 'accuracy' | 'stars'>,
  best: Pick<SessionResult, 'cpm' | 'accuracy' | 'stars'> | undefined,
): boolean {
  if (!best) return true
  if (candidate.stars !== best.stars) return candidate.stars > best.stars
  if (candidate.cpm !== best.cpm) return candidate.cpm > best.cpm
  return candidate.accuracy > best.accuracy
}
