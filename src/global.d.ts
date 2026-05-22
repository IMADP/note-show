// Minimal ambient declarations for the File System Access API.
// Lib.dom hasn't shipped these in our current TypeScript yet (see plan §16).

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>
  seek(position: number): Promise<void>
  truncate(size: number): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  readonly kind: 'file'
  readonly name: string
  getFile(): Promise<File>
  createWritable(options?: {
    keepExistingData?: boolean
  }): Promise<FileSystemWritableFileStream>
}

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, readonly `.${string}`[] | `.${string}`[]>
}

interface OpenFilePickerOptions {
  multiple?: boolean
  excludeAcceptAllOption?: boolean
  types?: readonly FilePickerAcceptType[]
}

interface SaveFilePickerOptions {
  excludeAcceptAllOption?: boolean
  suggestedName?: string
  types?: readonly FilePickerAcceptType[]
}

interface Window {
  showOpenFilePicker(
    options?: OpenFilePickerOptions,
  ): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(
    options?: SaveFilePickerOptions,
  ): Promise<FileSystemFileHandle>
}
