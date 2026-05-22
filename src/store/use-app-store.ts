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

const WELCOME_CONTENT = `# Welcome to Note Show

This is **note show**, a single user, offline, local-first markdown notebook. Everything you type lives in one JSON file on your hard drive. No accounts, no servers, no sync, no telemetry. The browser is just a renderer; your data is yours.

If you opened this page in a fresh notebook, you can safely delete it once you have read through. It is a regular page like any other, and the file you created is now ready for you to write in.

## The idea

Note taking apps have a tendency to grow into platforms. They add sync, sharing, AI features, collaboration, plugin ecosystems, and an obligation to onboard. note-show is the opposite. It is a markdown editor that opens one file and writes to it. That is the whole product.

A few things follow from that:

- **No database.** The notebook is a plain JSON document. You can copy it, version control it, diff it, grep it, back it up the same way you back up any other document.
- **No server.** The page you are looking at right now is being served from your local browser. Close the tab and nothing is happening anywhere on your behalf.
- **No accounts.** There is nothing to sign in to. There is no "your notebook" because the notebook is *literally* yours.
- **One file, atomic writes.** Every save rewrites the whole file. Either the new version is on disk, or the old one is, never an in-between state.

> The point is to keep the source plain. There is no rich text toolbar, no contenteditable, no slash commands. You type markdown, and the app reads it back to you rendered. That is the contract.

## Getting started

The flow is short:

1. Open or create a notebook through the file menu at the top of the sidebar.
2. Click **New page** to add a page.
3. Click **Edit**, or pick an existing page and click its **Edit** button.
4. Write. Hit \`Ctrl+S\` (or \`⌘S\` on macOS) to save. The editor closes and the page renders.
5. Repeat.

The file menu also lets you switch between notebooks. Each notebook is a separate file, so you can keep a work notebook and a personal one without them touching each other.

> **A note on browsers.** This app uses the File System Access API, which today means a Chromium-based browser (Chrome, Edge, Arc, Brave, Opera). Firefox and Safari are not supported. If you open it in one of those, the app will refuse to start and tell you why.

## What you can write

The renderer supports the full set of features a working writer needs. The next few sections walk through them naturally.

### Inline formatting

The usual suspects: **bold**, *italic*, ***bold and italic***, ~~struck through~~, and \`inline code\`. You can also link to things, both [external sites like example.com](https://example.com) and other pages within the same notebook by their URL.

Autolinks work too: paste a URL like https://wikipedia.org and it becomes a link. 

### Headings

There are six heading levels, but in practice you will rarely need more than three. The renderer styles \`<h1>\` with a thick accent underline, and \`<h2>\` in the accent color with a thin gray rule beneath. \`<h3>\` is plain, just a slightly heavier body text. The visual hierarchy is intentional: a document with three or four \`<h2>\` sections and a few \`<h3>\` subsections feels readable. A document with eight nested \`<h6>\` does not.

### Lists

Unordered lists use a single dash:

- Eggs
- Flour
- A reasonable amount of butter
- Whatever else feels right at the time

Nested lists indent by two spaces:

- Pantry
  - Dry goods
    - Flour
    - Sugar
    - Salt
  - Spices
    - Bay leaves
    - A jar of paprika that has been there for years
- Fridge
  - Eggs
  - The remnants of last weekend's leftovers

Ordered lists count themselves:

1. Open a notebook
2. Create a page
3. Write
4. Save
5. Repeat indefinitely

Task lists work the same way, with a checkbox marker:

- [x] Implement basic markdown rendering
- [x] Add syntax highlighting for code blocks
- [x] Hook up math via KaTeX
- [ ] Lazy load the math and highlight bundles
- [ ] Wire up \`beforeunload\` for unsaved drafts
- [ ] Lots more polish

### Quotes and callouts

Block quotes are styled as left-bordered callouts in the doc theme. They are useful for excerpts:

> The most important thing you can do with software, far more important than performance, is to be able to *change your mind*. Most software is more or less correct most of the time. Almost no software is easy to change.

And for self-explanation, like an editorial aside in a longer piece:

> Why JSON and not SQLite, or a folder of markdown files? Because a single JSON file is the smallest backing store that gives you transactional whole file writes and trivial portability. A folder of markdown files would require you to think about ordering, indexing, and orphaned references. SQLite would require a runtime you do not want to bundle. JSON is boring, and that is the feature.

### Tables

Tables look like this:

| Shortcut      | Action                              |
|---------------|-------------------------------------|
| \`Ctrl+S\`      | Save the current draft              |
| \`Ctrl+Enter\`  | Save the current draft (alternate)  |
| \`Esc\`         | Cancel the current edit             |
| Click sidebar | Switch to another page              |

Alignment is supported with the usual \`:---\`, \`:---:\`, \`---:\` markers:

| Item              | Quantity (units) | Subtotal   |
|:------------------|:----------------:|-----------:|
| Notebook          |        1         |   $4.95    |
| Roller pens, pack |        2         |  $11.80    |
| Stickers          |        1         |   $2.40    |
| **Total**         |                  | **$19.15** |

Wider tables (with more columns or longer cells) work too, but they will wrap or scroll on narrower windows.

### Code

Inline code looks like \`npm run dev\` or \`const x = 42\`. Code fences support a language hint that drives the syntax highlighter:

\`\`\`ts
type Page = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

function buildWelcome(): Page {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'Welcome',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}
\`\`\`

A Python sample, for variety:

\`\`\`python
from pathlib import Path
import json

def load_notebook(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)

def count_pages(path: Path) -> int:
    data = load_notebook(path)
    return len(data.get("pages", []))

if __name__ == "__main__":
    target = Path("notebook.json")
    print(f"{count_pages(target)} pages in {target.name}")
\`\`\`

And a chunk of shell, because every guide ends up with one eventually:

\`\`\`bash
# Back up your notebook before any risky operation.
cp notebook.json "notebook.$(date +%Y-%m-%d).bak.json"

# Pretty print to see what is in it.
jq '.pages | map({title, len: (.content | length)})' notebook.json

# Search across all pages for a word.
jq -r '.pages[] | select(.content | test("regex")) | .title' notebook.json
\`\`\`

Languages with no syntax highlighter registered fall back to plain monospace blocks:

\`\`\`
This is just a block of preformatted text.
Whitespace      is      preserved      verbatim,
which is occasionally what you want.
\`\`\`

### Math

Inline math uses single dollars, so $E = mc^2$ slots into a sentence without any visual fuss. The classic example is the area of a circle, $A = \\pi r^2$, or Euler's identity, $e^{i\\pi} + 1 = 0$.

Display math uses double dollars:

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$

A slightly fancier one, the Gaussian integral:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

And the sum that every undergraduate learns first:

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

You can mix math into a sentence and a display block in the same paragraph. Given a vector $\\vec{v} \\in \\mathbb{R}^n$, its Euclidean norm is $\\|\\vec{v}\\| = \\sqrt{\\vec{v} \\cdot \\vec{v}}$, expanded out:

$$
\\|\\vec{v}\\| = \\sqrt{\\sum_{i=1}^{n} v_i^2}
$$

### Horizontal rules

A line with three dashes draws a horizontal rule. They are useful for separating sections that are not strictly headed.

---

## A worked example

Suppose you keep meeting notes in this notebook. Here is a single page, top to bottom, as you might write it.

> **Team sync, April 8.** Present: Alex, Priya, Marcus. Apologies: Lena.

### Updates

- **Alex.** Wrapped the address validation rewrite. Two regressions caught in QA, both fixed. Ready to ship behind a flag next week.
- **Priya.** Working through the Canopi integration. The mock server is up; she is blocked on credentials for the staging instance.
- **Marcus.** Spike on the new rejection flow looks promising. He will write up findings by Friday.

### Decisions

1. Ship the address validation rewrite to staging on Monday, full rollout the following Friday.
2. Move the Canopi cutover to next sprint to give Priya time to unblock.
3. Marcus owns the write up; Alex will review.

### Action items

- [ ] Alex: open the feature flag PR by EOD Wednesday.
- [ ] Priya: chase the staging credentials with platform-ops.
- [ ] Marcus: post the spike write up to the team channel by Friday.
- [x] Lena (deferred): catch up on the recording.

That should be enough context for next week's review.

---

## File format

The notebook on disk is a JSON document with a tiny shape:

\`\`\`json
{
  "version": 1,
  "pages": [
    {
      "id": "0d61c0c2-1b59-4c9c-9ffe-e9c2c3e1c9f1",
      "title": "Welcome",
      "content": "# Welcome\\n\\nThis is...",
      "createdAt": "2026-05-22T10:14:33.221Z",
      "updatedAt": "2026-05-22T10:14:33.221Z"
    }
  ]
}
\`\`\`

A few things to know:

- **Stable IDs.** Each page has a UUID. The sidebar order is the order in the \`pages\` array. There is no separate sort key, no parent reference, no nesting.
- **Whole file writes.** Every save serializes the entire structure and writes it atomically. There is no diffing.
- **Forward compatibility.** The renderer refuses to open a file whose \`version\` is higher than it understands. If we ever change the schema, you will see a clear error rather than a corrupted notebook.

For anyone curious, the read and write logic is small enough to fit in your head[^io]. It lives in \`src/lib/file-io.ts\` and \`src/lib/storage.ts\` in the source tree.

## Keyboard shortcuts

| Context        | Shortcut                  | Action                              |
|----------------|---------------------------|-------------------------------------|
| Editing a page | \`Ctrl+S\` / \`⌘S\`           | Save the current draft              |
| Editing a page | \`Ctrl+Enter\` / \`⌘Enter\`   | Save the current draft (alternate)  |
| Editing a page | \`Esc\`                     | Cancel (with confirm if dirty)      |
| Viewing a page | \`Tab\` then space          | Move focus to the Edit button       |

Most other interactions are click driven by design. There is no command palette, no fuzzy finder, no jump-to-page modal. If you find yourself needing one, the notebook has probably grown beyond what this app wants to be.

## Common questions

### Where is my data?

In the JSON file you opened. Nowhere else. You can verify this by closing the tab, opening the file in any text editor, and reading it directly. It is a regular file.

### Can I open the same notebook in two tabs?

You can, but you should not. There is no locking and no conflict detection. Whichever tab saves last wins, and the loser will not know about it until the next reload.

### Can I sync this between machines?

Use any file sync tool you already trust. Dropbox, iCloud Drive, OneDrive, Syncthing, a git repository, an external drive, an email to yourself, whatever fits. The notebook is just a file.

### Is there a mobile version?

No. The File System Access API is not available on iOS, and the design assumes a keyboard. If you need notes on the go, write them somewhere else and paste them in later.

### How big can the notebook get?

Larger than you would think. The whole file is loaded into memory and rewritten on every save, so the practical ceiling is somewhere between "ten thousand short pages" and "a few thousand pages with embedded code, math, and tables." If you are bumping that, split into multiple notebooks.

### What about images?

Images via the standard \`![alt](url)\` markdown syntax render if the URL is reachable. There is no upload flow and no image storage. If you want a picture in a page, host it somewhere and link it. This is intentional: the notebook stays small and portable.

### Why no rich text?

Because rich text editors are leaky abstractions on top of HTML. The moment you adopt one, you inherit its quirks, its serialization format, and its inevitable disagreements with the next one. Plain markdown is portable, durable, and *legible* without the editor that produced it.

---

## Roadmap

The app is feature complete for the original goal. The remaining work is polish:

- [x] Open and create files
- [x] Add, rename, delete pages
- [x] Per page edit and save cycle with confirm on cancel
- [x] Markdown rendering with GFM, math, and syntax highlighting
- [x] Doc style accents for headings, tables, blockquotes, and inline code
- [ ] \`beforeunload\` warning when there is an unsaved draft
- [ ] Lazy load KaTeX and highlight.js to shrink the initial bundle
- [ ] Lazy load the editor route as well
- [ ] Optional: a "recent files" list in the file menu

## Acknowledgments

note-show is built on a small set of dependencies, each of which deserves a mention:

1. [React](https://react.dev) and [Vite](https://vite.dev), for the obvious reasons.
2. [Zustand](https://github.com/pmndrs/zustand), for being the simplest state library that does the job.
3. [react-markdown](https://github.com/remarkjs/react-markdown), [remark-gfm](https://github.com/remarkjs/remark-gfm), [remark-math](https://github.com/remarkjs/remark-math), [KaTeX](https://katex.org), and [rehype-highlight](https://github.com/rehypejs/rehype-highlight), which together do the heavy lifting on the rendering side.
4. [Tailwind CSS](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com), for letting the visual layer come together quickly without locking it into one look.
5. The File System Access API, which is the entire reason this app is possible without a backend.

That is the whole list. Everything else is plumbing.

---

## Closing

You have read to the end of the welcome page. Thank you for indulging the long version. Now go ahead and delete this page (hover it in the sidebar) and start writing your own.
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
