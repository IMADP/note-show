import type { Page } from '@/store/use-app-store'

export type FileFormat = {
  version: 1
  pages: Page[]
}

export const CURRENT_VERSION = 1 as const

export function serialize(data: FileFormat): string {
  return JSON.stringify(data, null, 2)
}

export function parse(raw: string): FileFormat {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return { version: CURRENT_VERSION, pages: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (err) {
    throw new Error(
      `Could not parse notebook file: ${(err as Error).message}`,
    )
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Notebook file is not a JSON object.')
  }

  const obj = parsed as Record<string, unknown>

  if (Object.keys(obj).length === 0) {
    return { version: CURRENT_VERSION, pages: [] }
  }

  const version = obj.version
  if (typeof version === 'number' && version > CURRENT_VERSION) {
    throw new Error(
      `Notebook version ${version} is newer than this app supports (${CURRENT_VERSION}).`,
    )
  }

  const pages = Array.isArray(obj.pages) ? (obj.pages as Page[]) : []
  return { version: CURRENT_VERSION, pages }
}
