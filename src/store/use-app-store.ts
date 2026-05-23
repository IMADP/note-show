import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import {
  pickFileToCreate,
  pickFileToOpen,
  writeFile,
} from '@/lib/file-io'
import {
  clearLastFile,
  loadLastFile,
  saveLastFile,
} from '@/lib/file-store'
import { parse } from '@/lib/storage'

import welcomeContent from './welcome.md?raw'

export type Page = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export type Folder = {
  id: string
  name: string
  collapsed: boolean
  pages: Page[]
}

export type AppState = {
  folders: Folder[]
  mode: 'view' | 'edit'
  editingId: string | null
  draft: { title: string; content: string } | null

  fileHandle: FileSystemFileHandle | null
  fileName: string | null

  restorable: { fileName: string } | null

  addFolder: () => string
  deleteFolder: (folderId: string) => void
  renameFolder: (folderId: string, name: string) => void
  toggleFolderCollapsed: (folderId: string) => void
  reorderFolders: (activeId: string, overId: string) => void

  addPageInFolder: (folderId: string) => string | null
  commitDndResult: (nextFolders: Folder[]) => void

  deletePage: (pageId: string) => void
  renamePage: (pageId: string, title: string) => void

  beginEdit: (pageId: string) => void
  cancelEdit: () => void
  saveEdit: () => Promise<void>
  updateDraft: (patch: Partial<{ title: string; content: string }>) => void

  openFile: () => Promise<void>
  createFile: () => Promise<void>
  tryRestoreLastFile: () => Promise<void>
  restoreLastFile: () => Promise<void>
  dismissRestore: () => Promise<void>
}

const now = () => new Date().toISOString()

function buildWelcomePage(): Page {
  const t = now()
  return {
    id: uuid(),
    title: 'Overview',
    content: welcomeContent,
    createdAt: t,
    updatedAt: t,
  }
}

function buildWelcomeFolder(): Folder {
  return {
    id: uuid(),
    name: 'Notes',
    collapsed: false,
    pages: [buildWelcomePage()],
  }
}

const seedFolders = (): Folder[] => [buildWelcomeFolder()]

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export type PageLocation = {
  folderIdx: number
  pageIdx: number
  folder: Folder
  page: Page
}

export function locatePage(
  folders: Folder[],
  pageId: string,
): PageLocation | null {
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i]
    for (let j = 0; j < folder.pages.length; j++) {
      const page = folder.pages[j]
      if (page.id === pageId) {
        return { folderIdx: i, pageIdx: j, folder, page }
      }
    }
  }
  return null
}

export function firstPageId(folders: Folder[]): string | null {
  for (const folder of folders) {
    if (folder.pages.length > 0) return folder.pages[0].id
  }
  return null
}

async function persist(
  handle: FileSystemFileHandle | null,
  folders: Folder[],
): Promise<void> {
  if (!handle) return
  try {
    await writeFile(handle, { version: 2, folders })
  } catch (err) {
    console.error('Failed to save notebook:', err)
    toast.error('Save failed', { description: describeError(err) })
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  folders: seedFolders(),
  mode: 'view',
  editingId: null,
  draft: null,
  fileHandle: null,
  fileName: null,
  restorable: null,

  addFolder: () => {
    const folder: Folder = {
      id: uuid(),
      name: 'New folder',
      collapsed: false,
      pages: [],
    }
    const nextFolders = [...get().folders, folder]
    set({ folders: nextFolders })
    void persist(get().fileHandle, nextFolders)
    return folder.id
  },

  deleteFolder: (folderId) => {
    const state = get()
    const target = state.folders.find((f) => f.id === folderId)
    if (!target) return
    const clearingEdit =
      state.editingId !== null && target.pages.some((p) => p.id === state.editingId)
    const nextFolders = state.folders.filter((f) => f.id !== folderId)
    set({
      folders: nextFolders,
      mode: clearingEdit ? 'view' : state.mode,
      editingId: clearingEdit ? null : state.editingId,
      draft: clearingEdit ? null : state.draft,
    })
    void persist(state.fileHandle, nextFolders)
  },

  renameFolder: (folderId, name) => {
    const state = get()
    const nextFolders = state.folders.map((f) =>
      f.id === folderId ? { ...f, name } : f,
    )
    set({ folders: nextFolders })
    void persist(state.fileHandle, nextFolders)
  },

  toggleFolderCollapsed: (folderId) => {
    const state = get()
    const nextFolders = state.folders.map((f) =>
      f.id === folderId ? { ...f, collapsed: !f.collapsed } : f,
    )
    set({ folders: nextFolders })
    void persist(state.fileHandle, nextFolders)
  },

  reorderFolders: (activeId, overId) => {
    if (activeId === overId) return
    const state = get()
    const from = state.folders.findIndex((f) => f.id === activeId)
    const to = state.folders.findIndex((f) => f.id === overId)
    if (from === -1 || to === -1) return
    const nextFolders = state.folders.slice()
    const [moved] = nextFolders.splice(from, 1)
    nextFolders.splice(to, 0, moved)
    set({ folders: nextFolders })
    void persist(state.fileHandle, nextFolders)
  },

  addPageInFolder: (folderId) => {
    const state = get()
    const folderIdx = state.folders.findIndex((f) => f.id === folderId)
    if (folderIdx === -1) return null
    const t = now()
    const page: Page = {
      id: uuid(),
      title: 'Untitled',
      content: '',
      createdAt: t,
      updatedAt: t,
    }
    const nextFolders = state.folders.slice()
    const folder = nextFolders[folderIdx]
    nextFolders[folderIdx] = {
      ...folder,
      collapsed: false,
      pages: [...folder.pages, page],
    }
    set({ folders: nextFolders })
    void persist(state.fileHandle, nextFolders)
    return page.id
  },

  commitDndResult: (nextFolders) => {
    set({ folders: nextFolders })
    void persist(get().fileHandle, nextFolders)
  },

  deletePage: (pageId) => {
    const state = get()
    const loc = locatePage(state.folders, pageId)
    if (!loc) return
    const clearingEdit = state.editingId === pageId
    const nextFolders = state.folders.slice()
    const folder = nextFolders[loc.folderIdx]
    nextFolders[loc.folderIdx] = {
      ...folder,
      pages: folder.pages.filter((p) => p.id !== pageId),
    }
    set({
      folders: nextFolders,
      mode: clearingEdit ? 'view' : state.mode,
      editingId: clearingEdit ? null : state.editingId,
      draft: clearingEdit ? null : state.draft,
    })
    void persist(state.fileHandle, nextFolders)
  },

  renamePage: (pageId, title) => {
    const state = get()
    const loc = locatePage(state.folders, pageId)
    if (!loc) return
    const nextFolders = state.folders.slice()
    const folder = nextFolders[loc.folderIdx]
    const nextPages = folder.pages.slice()
    nextPages[loc.pageIdx] = { ...loc.page, title, updatedAt: now() }
    nextFolders[loc.folderIdx] = { ...folder, pages: nextPages }
    set({ folders: nextFolders })
    void persist(state.fileHandle, nextFolders)
  },

  beginEdit: (pageId) => {
    const loc = locatePage(get().folders, pageId)
    if (!loc) return
    set({
      mode: 'edit',
      editingId: pageId,
      draft: { title: loc.page.title, content: loc.page.content },
    })
  },

  cancelEdit: () => {
    set({ mode: 'view', editingId: null, draft: null })
  },

  saveEdit: async () => {
    const { draft, editingId, folders, fileHandle } = get()
    if (!draft || !editingId) return
    const loc = locatePage(folders, editingId)
    if (!loc) return

    const nextFolders = folders.slice()
    const folder = nextFolders[loc.folderIdx]
    const nextPages = folder.pages.slice()
    nextPages[loc.pageIdx] = {
      ...loc.page,
      title: draft.title,
      content: draft.content,
      updatedAt: now(),
    }
    nextFolders[loc.folderIdx] = { ...folder, pages: nextPages }

    if (fileHandle) {
      try {
        await writeFile(fileHandle, { version: 2, folders: nextFolders })
      } catch (err) {
        console.error('Failed to save notebook:', err)
        toast.error('Save failed', { description: describeError(err) })
        return
      }
    }

    set({ folders: nextFolders, mode: 'view', editingId: null, draft: null })
  },

  updateDraft: (patch) => {
    set((state) =>
      state.draft ? { draft: { ...state.draft, ...patch } } : {},
    )
  },

  openFile: async () => {
    let result
    try {
      result = await pickFileToOpen()
    } catch (err) {
      console.error('Failed to open file:', err)
      toast.error('Could not open file', { description: describeError(err) })
      return
    }
    if (!result) return
    set({
      fileHandle: result.handle,
      fileName: result.handle.name,
      folders: result.data.folders,
      mode: 'view',
      editingId: null,
      draft: null,
      restorable: null,
    })
    void rememberFile(result.handle)
    toast.success(`Opened ${result.handle.name}`)
  },

  createFile: async () => {
    let result
    try {
      result = await pickFileToCreate()
    } catch (err) {
      console.error('Failed to create file:', err)
      toast.error('Could not create file', { description: describeError(err) })
      return
    }
    if (!result) return

    const seededFolders = [buildWelcomeFolder()]
    try {
      await writeFile(result.handle, { version: 2, folders: seededFolders })
    } catch (err) {
      console.error('Failed to seed new file:', err)
      toast.error('Could not seed new file', { description: describeError(err) })
      return
    }

    set({
      fileHandle: result.handle,
      fileName: result.handle.name,
      folders: seededFolders,
      mode: 'view',
      editingId: null,
      draft: null,
      restorable: null,
    })
    void rememberFile(result.handle)
    toast.success(`Created ${result.handle.name}`)
  },

  tryRestoreLastFile: async () => {
    if (get().fileHandle) return

    let stored
    try {
      stored = await loadLastFile()
    } catch (err) {
      console.error('Failed to read last-file from IDB:', err)
      return
    }
    if (!stored) return

    let perm: PermissionState
    try {
      perm = await stored.handle.queryPermission({ mode: 'readwrite' })
    } catch (err) {
      console.error('queryPermission failed:', err)
      void clearLastFile()
      return
    }

    if (perm === 'denied') {
      void clearLastFile()
      return
    }
    if (perm !== 'granted') {
      set({ restorable: { fileName: stored.fileName } })
      return
    }

    try {
      const file = await stored.handle.getFile()
      const data = parse(await file.text())
      set({
        fileHandle: stored.handle,
        fileName: stored.handle.name,
        folders: data.folders,
        mode: 'view',
        editingId: null,
        draft: null,
        restorable: null,
      })
    } catch (err) {
      console.error('Failed to silent-restore last file:', err)
      void clearLastFile()
    }
  },

  restoreLastFile: async () => {
    let stored
    try {
      stored = await loadLastFile()
    } catch (err) {
      console.error('Failed to read last-file from IDB:', err)
      toast.error('Could not reopen file', { description: describeError(err) })
      return
    }
    if (!stored) {
      set({ restorable: null })
      return
    }

    let perm: PermissionState
    try {
      perm = await stored.handle.requestPermission({ mode: 'readwrite' })
    } catch (err) {
      console.error('requestPermission failed:', err)
      toast.error('Could not reopen file', { description: describeError(err) })
      return
    }

    if (perm !== 'granted') {
      toast.error('Permission required to reopen the file.')
      return
    }

    try {
      const file = await stored.handle.getFile()
      const data = parse(await file.text())
      set({
        fileHandle: stored.handle,
        fileName: stored.handle.name,
        folders: data.folders,
        mode: 'view',
        editingId: null,
        draft: null,
        restorable: null,
      })
      toast.success(`Reopened ${stored.handle.name}`)
    } catch (err) {
      console.error('Failed to load restored file:', err)
      toast.error('Could not read file', { description: describeError(err) })
      void clearLastFile()
      set({ restorable: null })
    }
  },

  dismissRestore: async () => {
    set({ restorable: null })
    try {
      await clearLastFile()
    } catch (err) {
      console.error('Failed to clear last-file from IDB:', err)
    }
  },
}))

async function rememberFile(handle: FileSystemFileHandle): Promise<void> {
  try {
    await saveLastFile({ handle, fileName: handle.name })
  } catch (err) {
    console.error('Failed to persist file handle to IDB:', err)
  }
}

export function isDraftDirty(state: AppState): boolean {
  if (state.mode !== 'edit' || !state.draft || !state.editingId) return false
  const loc = locatePage(state.folders, state.editingId)
  if (!loc) return false
  return (
    state.draft.title !== loc.page.title ||
    state.draft.content !== loc.page.content
  )
}
