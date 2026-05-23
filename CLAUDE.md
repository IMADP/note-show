# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

note-show is a single-user, offline, browser-based markdown notebook. All data lives in **one JSON file on the user's hard drive**, opened via the File System Access API. **Chromium-only by design** (Firefox/Safari don't implement the API).

The design document is `new-app-plan.md` at the repo root — it covers the data model, decisions made vs. rejected, and a 6-phase implementation roadmap. All MVP phases are implemented; the remaining items from the original Phase 6 list are `beforeunload` for unsaved drafts and bundle code-splitting. **Consult that doc before introducing new patterns** — many "obvious" alternatives (TipTap, contenteditable, hierarchical pages, partial file writes, raw HTML in markdown) were deliberately rejected.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173 (HMR)
- `npm run build` — `tsc -b && vite build`. **The build is the type-check** — there is no separate `typecheck` script. Run this to verify TS soundness.
- `npm run lint` — ESLint
- `npm run preview` — preview the production build
- `npx shadcn@latest add <name>` — pull a new shadcn component into `src/components/ui/`. **Do not hand-write shadcn components from memory** (the API shifts across releases); always pull via CLI. To re-pull an existing one, add `--overwrite` — but see "Deliberate edits to shadcn primitives" below before doing so.

No test runner is configured. Verification of UI changes is manual via the dev server — see plan §17 for the MVP "shippable" checklist.

## Architecture

### Single source of truth: the Zustand store

`src/store/use-app-store.ts` holds everything: `pages`, edit-mode state (`mode`/`editingId`/`draft`), and the active `fileHandle`/`fileName`. Critically:

- **The currently-selected page is NOT in the store** — it is derived from `useParams<{id: string}>()` of the `/page/:id` route. This is intentional (deep links and the back button Just Work). Don't add `selectedPageId` to the store.
- **Edit mode IS in the store**, not URL state. `editingId` tracks which page is being edited. `draft` lives outside `pages` so Cancel is trivial.
- **`isDraftDirty(state)`** is exported from the store and used by both the page header (Cancel) and the sidebar (cross-page nav guard) via the shared `DiscardDialog`.

### Persistence model: eager, atomic, whole-file

Every store mutation that changes `pages` (`addPage`, `deletePage`, `renamePage`, `reorderPages`, `saveEdit`) writes the **entire file** through `writeFile` in `src/lib/file-io.ts`. No diffs, no partial writes, no debouncing. There is intentionally **no global "Save File" button** — per-page Save is also a file save (plan §6).

- `saveEdit` is `async` and **awaits the disk write**. If the write throws, edit mode is preserved so the user can retry. The in-memory commit only happens after the write succeeds.
- Other mutations commit in memory first and fire-and-forget the write (`void persist(...)`). On failure they `toast.error(...)` via sonner.
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

### Sidebar shell (custom layout)

The sidebar is not a stock shadcn `Sidebar` layout — `src/features/sidebar/app-sidebar.tsx` overrides several shadcn primitives:

- `SidebarHeader` has `p-0` so the `FileMenu` (a `SidebarMenuButton` styled `h-[48px] rounded-none px-4`) fills edge-to-edge and aligns vertically with the 49px `PageHeader` border on the right.
- There is no `SidebarGroupLabel` — the page list lives directly in a bare `SidebarGroup`.
- The "Add Page" action is in `SidebarFooter` (also `p-0`, with another `h-[48px] rounded-none` button), not as a `SidebarGroupAction` "+" inside the header.
- Each `PageListItem` uses `size="md"` on the `SidebarMenuButton` — a **custom size variant** added to the shadcn cva (see "Deliberate edits to shadcn primitives" below).

### Sortable pages (drag-and-drop)

Page reordering uses `@dnd-kit/core` + `@dnd-kit/sortable`:

- `src/features/sidebar/page-list.tsx` wraps the menu in `<DndContext>` + `<SortableContext>` (vertical list strategy, `closestCenter` collision).
- `PointerSensor` has `activationConstraint: { distance: 4 }` so a click stays a click; drag starts only after 4px of movement. This lets the same row be a drag handle AND a navigation click target.
- `KeyboardSensor` is wired with `sortableKeyboardCoordinates` for `Space` to pick up, arrows to move, `Space` again to drop.
- `PageListItem` uses `useSortable({ id: page.id })` and spreads `attributes`/`listeners` onto the `SidebarMenuButton`. `touch-none select-none` prevent touch-scroll and text-selection from intercepting drags.
- On drop, the store's `reorderPages(activeId, overId)` splices the dragged page in place and persists. **The file order IS the sidebar order** — no separate sort key (plan §2).

### Markdown rendering

`src/lib/markdown.tsx` configures `react-markdown` with `remark-gfm`, `remark-math`, `rehype-katex`. Code highlighting is **Shiki**, called synchronously via `createHighlighterCoreSync` from `shiki/core` with statically-imported themes and grammars (no async rehype plugin, since react-markdown's `unified.runSync()` can't await). Languages outside the registered list render as plain text. **Raw HTML passthrough is intentionally not enabled** (no `rehype-raw`) — the renderer is trusted, content is user-authored, and allowing raw HTML invites XSS without adding capability. External-link `<a>` rendering opens in a new tab with `rel="noreferrer noopener"`.

The view is wrapped two layers deep: `<div class="note-prose-surface">` provides theme-token-driven custom properties (`--prose-body`, `--prose-quote-bg`, `--prose-quote-bar`), and `<article class="note-prose prose prose-neutral dark:prose-invert max-w-none">` carries the actual prose classes. The `.note-prose` rules in `src/index.css` follow shadcn typography conventions (h1 `text-4xl` weight-extrabold, h2 with `border-b`, etc.) and use the app's theme tokens (`var(--foreground)`, `var(--border)`, `var(--muted)`, `var(--primary)`, `var(--radius)`) so light/dark mode comes for free. Selectors use `.prose.note-prose` to outrank the `@tailwindcss/typography` plugin's `:where()`-wrapped defaults.

Fonts are Geist Variable (sans, body + headings) and JetBrains Mono (code), both via `@fontsource(-variable)` packages and imported in `src/index.css`. KaTeX CSS is also imported there.

Bundle weight is dominated by Shiki grammars + KaTeX fonts. The chunk-size warning at build is expected — lazy-loading or further splitting is the remaining open polish item.

### Deliberate edits to shadcn primitives

A few shadcn UI primitives have been **intentionally hand-edited** beyond what `shadcn add` produces. If you re-pull these with `--overwrite`, you will wipe these changes — restore them:

- `src/components/ui/button.tsx` — added `cursor-pointer` to the base cva. Tailwind's preflight removes the default pointer on `<button>`; this restores it globally so every shadcn button gets the right cursor.
- `src/components/ui/sidebar.tsx` — added a `md` size variant to `sidebarMenuButtonVariants` (`h-10 text-sm`) and added the matching `peer-data-[size=md]/menu-button:top-2.5` to `SidebarMenuAction` so action buttons stay vertically centered on `md` rows. `PageListItem` depends on `size="md"`.

If you need to add another variant to a shadcn primitive, prefer adding it to the cva rather than wrapping the component — the cva variants flow into the type signature, and a wrapping component drifts.

### File layout

```
src/
  components/ui/       # shadcn — CLI-managed, see "Deliberate edits" above
  features/
    sidebar/           # AppSidebar shell, file menu, page list (sortable)
    page/              # PageRoute, header, view, edit, discard-dialog
    empty-state.tsx
    no-file-banner.tsx
    browser-gate.tsx
  lib/
    file-io.ts         # File System Access wrappers (sole consumer: the store)
    storage.ts         # FileFormat schema + parse/serialize
    markdown.tsx       # react-markdown + Shiki
    keyboard.ts        # global Ctrl/Cmd+S listener
    utils.ts           # shadcn cn() helper
  store/use-app-store.ts
  global.d.ts          # File System Access API ambient types
```

## Conventions

- `@/*` path alias points at `src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`). `baseUrl` is intentionally omitted — TS 6 deprecated it; `paths` alone resolves.
- Tailwind v4 via `@tailwindcss/vite` (not PostCSS).
- Data file format is `{version: 1, pages: Page[]}`. `parse()` treats empty files as `{version: 1, pages: []}` and refuses files with a higher `version` than `CURRENT_VERSION`. **Bump the version when changing the schema** and write a migration in `storage.ts`.
- Pages are a flat ordered array. Order in the array is the order in the sidebar — there is no `index` sort key. Drag-to-sort splices the array directly. Do not reintroduce hierarchy or sort-key trickery (plan §2, §4).
- The seed content for newly-created files lives in `WELCOME_CONTENT` inside `use-app-store.ts`. `createFile()` writes a single page with this content to the new file before opening it.
