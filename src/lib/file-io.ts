import { parse, serialize, type FileFormat } from './storage'

const PICKER_TYPES = [
  {
    description: 'Notebook',
    accept: { 'application/json': ['.json'] as readonly `.${string}`[] },
  },
] as const

export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    'showSaveFilePicker' in window
  )
}

export type LoadedFile = {
  handle: FileSystemFileHandle
  data: FileFormat
}

export async function pickFileToOpen(): Promise<LoadedFile | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: PICKER_TYPES,
      excludeAcceptAllOption: false,
      multiple: false,
    })
    const file = await handle.getFile()
    const text = await file.text()
    const data = parse(text)
    return { handle, data }
  } catch (err) {
    if (isAbortError(err)) return null
    throw err
  }
}

export async function pickFileToCreate(): Promise<LoadedFile | null> {
  try {
    const handle = await window.showSaveFilePicker({
      types: PICKER_TYPES,
      excludeAcceptAllOption: false,
      suggestedName: 'notebook.json',
    })
    const data: FileFormat = { version: 1, folders: [] }
    await writeFile(handle, data)
    return { handle, data }
  } catch (err) {
    if (isAbortError(err)) return null
    throw err
  }
}

export async function writeFile(
  handle: FileSystemFileHandle,
  data: FileFormat,
): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await writable.write(serialize(data))
  } finally {
    await writable.close()
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}
