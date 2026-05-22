import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import {
  pickFileToCreate,
  pickFileToOpen,
  writeFile,
} from '@/lib/file-io'

export type Page = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export type AppState = {
  pages: Page[]
  mode: 'view' | 'edit'
  editingId: string | null
  draft: { title: string; content: string } | null

  fileHandle: FileSystemFileHandle | null
  fileName: string | null

  addPage: () => string
  deletePage: (id: string) => void
  renamePage: (id: string, title: string) => void

  beginEdit: (id: string) => void
  cancelEdit: () => void
  saveEdit: () => Promise<void>
  updateDraft: (patch: Partial<{ title: string; content: string }>) => void

  openFile: () => Promise<void>
  createFile: () => Promise<void>
}

const now = () => new Date().toISOString()

const WELCOME_CONTENT = `# Welcome

This is **note-show**, a small local markdown notebook. Everything you write lives in a single JSON file on your hard drive. There is no account, no server, and nothing leaves your machine.

## Getting started

Use the file menu at the top of the sidebar to open an existing notebook or create a new one. Until you do, anything you type stays in memory and disappears when you refresh. When no file is open, that file selector turns amber as a reminder.

Each page has a title and a markdown body. Click **Edit** to start writing, then **Save** (or press Ctrl+S) to commit. The page renders as formatted markdown whenever you are not actively editing it.

## What you can write

Most of what you would expect from a modern markdown editor works here. Headings, **bold**, *italic*, \`inline code\`, lists, blockquotes, and [links](https://example.com) are the basics. You can also use fenced code blocks (with syntax highlighting), tables, task lists, and inline or block math.

The point is to keep the source plain. There is no rich-text toolbar, no contenteditable, no slash commands. You just type markdown and read it back rendered. If you copy text in from somewhere else (an AI assistant, an old note, a wiki), it generally lands fine.

## How files work

Your notebook is one JSON file. Open it, write some pages, save, and that single file holds everything. You can copy it to another machine, drop it in iCloud or Dropbox, commit it to a git repository, or back it up the same way you back up any other document. Every save writes the whole file immediately, so closing the tab will not lose anything you have saved.

The only catch is that this app uses the browser's File System Access API, which today means a Chromium-based browser (Chrome, Edge, Arc, Brave, Opera). If you open it in Firefox or Safari it will refuse to start.

## A few things to know

- Hover a page in the sidebar to find its delete action.
- Ctrl+S (or Cmd+S) saves while you are editing. Cancel discards your draft after a confirm.
`

function buildWelcomePage(): Page {
  const t = now()
  return {
    id: uuid(),
    title: 'Welcome',
    content: WELCOME_CONTENT,
    createdAt: t,
    updatedAt: t,
  }
}

const seedPages = (): Page[] => [buildWelcomePage()]

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

async function persist(
  handle: FileSystemFileHandle | null,
  pages: Page[],
): Promise<void> {
  if (!handle) return
  try {
    await writeFile(handle, { version: 1, pages })
  } catch (err) {
    console.error('Failed to save notebook:', err)
    toast.error('Save failed', { description: describeError(err) })
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  pages: seedPages(),
  mode: 'view',
  editingId: null,
  draft: null,
  fileHandle: null,
  fileName: null,

  addPage: () => {
    const t = now()
    const page: Page = {
      id: uuid(),
      title: 'Untitled',
      content: '',
      createdAt: t,
      updatedAt: t,
    }
    const nextPages = [...get().pages, page]
    set({ pages: nextPages })
    void persist(get().fileHandle, nextPages)
    return page.id
  },

  deletePage: (id) => {
    const state = get()
    const clearingEdit = state.editingId === id
    const nextPages = state.pages.filter((p) => p.id !== id)
    set({
      pages: nextPages,
      mode: clearingEdit ? 'view' : state.mode,
      editingId: clearingEdit ? null : state.editingId,
      draft: clearingEdit ? null : state.draft,
    })
    void persist(state.fileHandle, nextPages)
  },

  renamePage: (id, title) => {
    const state = get()
    const nextPages = state.pages.map((p) =>
      p.id === id ? { ...p, title, updatedAt: now() } : p,
    )
    set({ pages: nextPages })
    void persist(state.fileHandle, nextPages)
  },

  beginEdit: (id) => {
    const page = get().pages.find((p) => p.id === id)
    if (!page) return
    set({
      mode: 'edit',
      editingId: id,
      draft: { title: page.title, content: page.content },
    })
  },

  cancelEdit: () => {
    set({ mode: 'view', editingId: null, draft: null })
  },

  saveEdit: async () => {
    const { draft, editingId, pages, fileHandle } = get()
    if (!draft || !editingId) return

    const nextPages = pages.map((p) =>
      p.id === editingId
        ? { ...p, title: draft.title, content: draft.content, updatedAt: now() }
        : p,
    )

    if (fileHandle) {
      try {
        await writeFile(fileHandle, { version: 1, pages: nextPages })
      } catch (err) {
        console.error('Failed to save notebook:', err)
        toast.error('Save failed', { description: describeError(err) })
        return
      }
    }

    set({ pages: nextPages, mode: 'view', editingId: null, draft: null })
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
      pages: result.data.pages,
      mode: 'view',
      editingId: null,
      draft: null,
    })
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

    // Seed newly-created files with a Welcome page.
    const seededPages = [buildWelcomePage()]
    try {
      await writeFile(result.handle, { version: 1, pages: seededPages })
    } catch (err) {
      console.error('Failed to seed new file:', err)
      toast.error('Could not seed new file', { description: describeError(err) })
      return
    }

    set({
      fileHandle: result.handle,
      fileName: result.handle.name,
      pages: seededPages,
      mode: 'view',
      editingId: null,
      draft: null,
    })
    toast.success(`Created ${result.handle.name}`)
  },
}))

export function isDraftDirty(state: AppState): boolean {
  if (state.mode !== 'edit' || !state.draft || !state.editingId) return false
  const page = state.pages.find((p) => p.id === state.editingId)
  if (!page) return false
  return state.draft.title !== page.title || state.draft.content !== page.content
}
