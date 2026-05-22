# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

note-show is a single-user, offline, browser-based markdown notebook. All data lives in **one JSON file on the user's hard drive**, opened via the File System Access API. **Chromium-only by design** (Firefox/Safari don't implement the API).

The authoritative design document is `new-app-plan.md` at the repo root — it covers the data model, decisions made vs. rejected, and a 6-phase implementation roadmap. Phases 1-5 are implemented; Phase 6 (sonner toasts, welcome-seeded files, navigate-away `beforeunload`, bundle code-split) is pending. **Consult that doc before introducing new patterns** — many "obvious" alternatives (TipTap, contenteditable, hierarchical pages, partial file writes, raw HTML in markdown) were deliberately rejected.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173 (HMR)
- `npm run build` — `tsc -b && vite build`. **The build is the type-check** — there is no separate `typecheck` script. Run this to verify TS soundness.
- `npm run lint` — ESLint
- `npm run preview` — preview the production build
- `npx shadcn@latest add <name>` — pull a new shadcn component into `src/components/ui/`. **Do not hand-write shadcn components from memory** (the API shifts across releases); always pull via CLI. To re-pull an existing one, add `--overwrite`.
 
No test runner is configured. Verification of UI changes is manual via the dev server — see plan §17 for the MVP "shippable" checklist.

## Architecture

### Single source of truth: the Zustand store

`src/store/use-app-store.ts` holds everything: `pages`, edit-mode state (`mode`/`editingId`/`draft`), and the active `fileHandle`/`fileName`. Critically:

- **The currently-selected page is NOT in the store** — it is derived from `useParams<{id: string}>()` of the `/page/:id` route. This is intentional (deep links and the back button Just Work). Don't add `selectedPageId` to the store.
- **Edit mode IS in the store**, not URL state. `editingId` tracks which page is being edited. `draft` lives outside `pages` so Cancel is trivial.
- **`isDraftDirty(state)`** is exported from the store and used by both the page header (Cancel) and the sidebar (cross-page nav guard) via the shared `DiscardDialog`.

### Persistence model: eager, atomic, whole-file

Every store mutation that changes `pages` (`addPage`, `deletePage`, `renamePage`, `saveEdit`) writes the **entire file** through `writeFile` in `src/lib/file-io.ts`. No diffs, no partial writes, no debouncing. There is intentionally **no global "Save File" button** — per-page Save is also a file save (plan §6).

- `saveEdit` is `async` and **awaits the disk write**. If the write throws, edit mode is preserved so the user can retry. The in-memory commit only happens after the write succeeds.
- Other mutations commit in memory first and fire-and-forget the write (`void persist(...)`). On failure they currently `console.error`; toast UX is Phase 6.
- If `fileHandle` is null, mutations stay in memory only and the amber `NoFileBanner` is shown.

All File System Access calls are isolated in `src/lib/file-io.ts`. The store is the only consumer. **Do not call `window.showOpenFilePicker` from components.**

### TypeScript and the File System Access API

The current TypeScript version's `lib.dom` does not ship `showOpenFilePicker` / `FileSystemFileHandle` types. They are declared in `src/global.d.ts` (per plan §16 — declare once globally, do not pepper `(window as any)`).

`tsconfig.app.json` enables `verbatimModuleSyntax: true`, so **type-only imports must use `import type`**. Also `noUnusedLocals` / `noUnusedParameters` are on.

### Routing and the empty state

`HashRouter` (works from `file://` and any static host with no server rewrites). Two routes only:

- `/` → `<EmptyState>`, which redirects to `/page/:firstId` when pages exist, else shows the welcome panel.
- `/page/:id` → `<PageRoute>`, which renders `<PageHeader>` plus either `<PageView>` or `<PageEdit>` depending on `mode`.

The `App.tsx` top-level checks `isFileSystemAccessSupported()` and renders `<BrowserGate>` instead of the app on non-Chromium browsers — do not bypass this.

### Global keyboard shortcuts

`useGlobalShortcuts()` (in `src/lib/keyboard.ts`) attaches a single `window` `keydown` listener at the App root. It reads store state via `useAppStore.getState()` — **not** via the hook — to avoid stale-closure bugs (plan §9 specifically calls this out). `Ctrl/Cmd+S` and `Ctrl/Cmd+Enter` both call `saveEdit()` while in edit mode.

### Markdown rendering

`src/lib/markdown.tsx` configures `react-markdown` with `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight`. Output is wrapped in `<article class="prose prose-neutral dark:prose-invert max-w-none">` (Tailwind Typography). **Raw HTML passthrough is intentionally not enabled** (no `rehype-raw`) — the renderer is trusted, content is user-authored, and allowing raw HTML invites XSS without adding capability. External-link `<a>` rendering opens in a new tab with `rel="noreferrer noopener"`.

KaTeX and highlight.js theme CSS are imported in `src/index.css`. These two libraries are why the bundle is ~970 KB (~300 KB gzip); the chunk-size warning at build is expected and is a Phase 6 polish concern (lazy-load or swap to Shiki).

### File layout

```
src/
  components/ui/       # shadcn — CLI-managed, do not hand-edit
  features/
    sidebar/           # AppSidebar shell, file menu, page list
    page/              # PageRoute, header, view, edit, discard-dialog
    empty-state.tsx
    no-file-banner.tsx
    browser-gate.tsx
  lib/
    file-io.ts         # File System Access wrappers (sole consumer: the store)
    storage.ts         # FileFormat schema + parse/serialize
    markdown.tsx       # react-markdown configured with plugins
    keyboard.ts        # global Ctrl/Cmd+S listener
    utils.ts           # shadcn cn() helper
  store/use-app-store.ts
  global.d.ts          # File System Access API ambient types
```

## Conventions

- `@/*` path alias points at `src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`). `baseUrl` is intentionally omitted — TS 6 deprecated it; `paths` alone resolves.
- Tailwind v4 via `@tailwindcss/vite` (not PostCSS).
- Data file format is `{version: 1, pages: Page[]}`. `parse()` treats empty files as `{version: 1, pages: []}` and refuses files with a higher `version` than `CURRENT_VERSION`. **Bump the version when changing the schema** and write a migration in `storage.ts`.
- Pages are a flat ordered array. Order in the array is the order in the sidebar — there is no `index` sort key. Do not reintroduce hierarchy or sort-key trickery (plan §2, §4).
