import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { levelKey } from '@/data/levels'
import { isBetter } from '@/domain/scoring'
import { readStorage, writeStorage } from '@/lib/storage'
import type { BestRecord, ProgressData, SessionResult } from '@/types'

const STORAGE_KEY = 'typing-practice:v1:progress'
const MAX_RESULTS = 200

function defaults(): ProgressData {
  return { version: 1, results: [], best: {}, updatedAt: 0 }
}

function isResult(value: unknown): value is SessionResult {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    (item.method === 'pinyin' || item.method === 'wubi' || item.method === 'shuangpin') &&
    typeof item.cpm === 'number' &&
    typeof item.accuracy === 'number' &&
    typeof item.finishedAt === 'number'
  )
}

function sanitize(value: unknown): ProgressData {
  if (!value || typeof value !== 'object') return defaults()
  const raw = value as Record<string, unknown>
  const results = Array.isArray(raw.results) ? raw.results.filter(isResult).slice(0, MAX_RESULTS) : []
  return {
    version: 1,
    results,
    best: rebuildBest(results),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  }
}

function toBest(result: SessionResult): BestRecord {
  return {
    resultId: result.id,
    cpm: result.cpm,
    accuracy: result.accuracy,
    stars: result.stars,
    finishedAt: result.finishedAt,
  }
}

function rebuildBest(results: SessionResult[]): Record<string, BestRecord> {
  const best: Record<string, BestRecord> = {}
  for (const result of [...results].reverse()) {
    const key = levelKey(result.method, result.scheme, result.levelId, result.mode)
    if (isBetter(result, best[key])) best[key] = toBest(result)
  }
  return best
}

export const useProgressStore = defineStore('progress', () => {
  const data = ref<ProgressData>(sanitize(readStorage<unknown>(STORAGE_KEY, null, (value): value is unknown => value !== null)))

  const results = computed(() => data.value.results)
  const best = computed(() => data.value.best)
  const totalSessions = computed(() => results.value.length)

  const bestCpm = computed(() =>
    results.value.reduce((max, item) => Math.max(max, item.cpm), 0),
  )
  const averageAccuracy = computed(() => {
    if (!results.value.length) return 0
    return results.value.reduce((sum, item) => sum + item.accuracy, 0) / results.value.length
  })

  watch(data, () => writeStorage(STORAGE_KEY, data.value), { deep: true })

  function addResult(result: SessionResult): { improved: boolean } {
    data.value.results = [result, ...data.value.results].slice(0, MAX_RESULTS)
    const key = levelKey(result.method, result.scheme, result.levelId, result.mode)
    const previous = data.value.best[key]
    const improved = isBetter(result, previous)
    if (improved) {
      data.value.best = { ...data.value.best, [key]: toBest(result) }
    }
    data.value.updatedAt = Date.now()
    return { improved }
  }

  function bestFor(method: string, scheme: string | null, levelId: string, mode: string): BestRecord | undefined {
    return data.value.best[levelKey(method as SessionResult['method'], scheme, levelId, mode)]
  }

  function recentFor(method: SessionResult['method'], scheme: string | null, limit = 20): SessionResult[] {
    return data.value.results
      .filter((item) => item.method === method && (method !== 'shuangpin' || item.scheme === scheme))
      .slice(0, limit)
  }

  function historyFor(method: SessionResult['method'], limit = 20): SessionResult[] {
    return data.value.results.filter((item) => item.method === method).slice(0, limit)
  }

  function mergeResults(list: SessionResult[]): number {
    const valid = list.filter(isResult)
    const existing = new Set(data.value.results.map((item) => item.id))
    const incoming = valid.filter((item) => !existing.has(item.id))
    if (!incoming.length) return 0
    data.value.results = [...incoming, ...data.value.results]
      .sort((a, b) => b.finishedAt - a.finishedAt)
      .slice(0, MAX_RESULTS)
    data.value.best = rebuildBest(data.value.results)
    data.value.updatedAt = Date.now()
    return incoming.length
  }

  function replace(next: ProgressData): void {
    data.value = sanitize(next)
  }

  function clear(): void {
    data.value = defaults()
  }

  return {
    data,
    results,
    best,
    totalSessions,
    bestCpm,
    averageAccuracy,
    addResult,
    bestFor,
    recentFor,
    historyFor,
    mergeResults,
    replace,
    clear,
  }
})
