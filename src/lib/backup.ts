import type { CustomData, ExportBundle, ProgressData, SettingsState } from '@/types'

export function createBundle(
  settings: SettingsState,
  progress: ProgressData,
  custom: CustomData,
): ExportBundle {
  return {
    app: 'jiandao-typing',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: JSON.parse(JSON.stringify(settings)) as SettingsState,
    progress: JSON.parse(JSON.stringify(progress)) as ProgressData,
    custom: JSON.parse(JSON.stringify(custom)) as CustomData,
  }
}

export type ParseResult =
  | { ok: true; bundle: ExportBundle }
  | { ok: false; error: string }

export function parseBundle(text: string): ParseResult {
  try {
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object') {
      return { ok: false, error: '文件内容不是有效的 JSON 对象。' }
    }
    const bundle = value as Partial<ExportBundle>
    if (bundle.app !== 'jiandao-typing') {
      return { ok: false, error: '这不是「键道」导出的备份文件。' }
    }
    if (bundle.version !== 1) {
      return { ok: false, error: `不支持的备份版本：${String(bundle.version)}` }
    }
    if (!bundle.progress || !Array.isArray(bundle.progress.results)) {
      return { ok: false, error: '备份缺少成绩数据（progress.results）。' }
    }
    return { ok: true, bundle: bundle as ExportBundle }
  } catch {
    return { ok: false, error: '文件不是合法的 JSON，请检查是否选择了正确的导出文件。' }
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
