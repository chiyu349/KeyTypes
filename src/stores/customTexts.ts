import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { readStorage, writeStorage } from '@/lib/storage'
import type { CustomData, CustomText, InputMethod } from '@/types'

const STORAGE_KEY = 'typing-practice:v1:custom'
const MAX_ITEMS = 20

function defaults(): CustomData {
  return { version: 1, items: [], updatedAt: 0 }
}

function isCustomText(value: unknown): value is CustomText {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.text === 'string' &&
    (item.method === 'pinyin' || item.method === 'wubi' || item.method === 'shuangpin') &&
    typeof item.createdAt === 'number'
  )
}

function sanitize(value: unknown): CustomData {
  if (!value || typeof value !== 'object') return defaults()
  const raw = value as Record<string, unknown>
  const items = Array.isArray(raw.items) ? raw.items.filter(isCustomText).slice(0, MAX_ITEMS) : []
  return {
    version: 1,
    items,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  }
}

export const useCustomTextsStore = defineStore('customTexts', () => {
  const data = ref<CustomData>(sanitize(readStorage<unknown>(STORAGE_KEY, null, (value): value is unknown => value !== null)))

  const items = computed(() => data.value.items)

  watch(data, () => writeStorage(STORAGE_KEY, data.value), { deep: true })

  function add(name: string, text: string, method: InputMethod): CustomText {
    const item: CustomText = {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || '未命名文本',
      text,
      method,
      createdAt: Date.now(),
    }
    data.value.items = [item, ...data.value.items].slice(0, MAX_ITEMS)
    data.value.updatedAt = Date.now()
    return item
  }

  function remove(id: string): void {
    data.value.items = data.value.items.filter((item) => item.id !== id)
    data.value.updatedAt = Date.now()
  }

  function find(id: string): CustomText | undefined {
    return data.value.items.find((item) => item.id === id)
  }

  function clear(): void {
    data.value = defaults()
  }

  function replace(next: CustomData): void {
    data.value = sanitize(next)
  }

  function merge(list: CustomText[]): void {
    const map = new Map<string, CustomText>()
    for (const item of [...list, ...data.value.items]) {
      if (isCustomText(item) && !map.has(item.id)) map.set(item.id, item)
    }
    data.value.items = [...map.values()].slice(0, MAX_ITEMS)
    data.value.updatedAt = Date.now()
  }

  return { data, items, add, remove, find, clear, replace, merge }
})
