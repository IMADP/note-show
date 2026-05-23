import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { useAppStore, type Folder } from '@/store/use-app-store'

import { FolderItem } from './folder-item'

function locatePageInFolders(
  folders: Folder[],
  pageId: string,
): { folderIdx: number; pageIdx: number } | null {
  for (let i = 0; i < folders.length; i++) {
    const idx = folders[i].pages.findIndex((p) => p.id === pageId)
    if (idx !== -1) return { folderIdx: i, pageIdx: idx }
  }
  return null
}

function findFolderIdx(folders: Folder[], folderId: string): number {
  return folders.findIndex((f) => f.id === folderId)
}

type DragMeta =
  | { kind: 'folder'; folder: Folder }
  | { kind: 'page'; folderId: string; pageId: string; title: string }
  | null

export function FolderList() {
  const storeFolders = useAppStore((s) => s.folders)
  const commitDndResult = useAppStore((s) => s.commitDndResult)

  const [mirror, setMirror] = useState<Folder[] | null>(null)
  const [activeMeta, setActiveMeta] = useState<DragMeta>(null)

  const renderedFolders = mirror ?? storeFolders

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const collisionDetection: CollisionDetection = useMemo(
    () => (args) => {
      const activeType = args.active.data.current?.type as
        | 'folder'
        | 'page'
        | undefined

      const containerType = (id: string | number) => {
        const container = args.droppableContainers.find((c) => c.id === id)
        return container?.data.current?.type as
          | 'folder'
          | 'page'
          | 'folder-drop'
          | undefined
      }

      let collisions = pointerWithin(args)
      if (collisions.length === 0) collisions = closestCorners(args)

      if (activeType === 'folder') {
        collisions = collisions.filter((c) => containerType(c.id) === 'folder')
      } else if (activeType === 'page') {
        collisions = collisions.filter((c) => {
          const t = containerType(c.id)
          return t === 'page' || t === 'folder-drop'
        })
        // Prefer specific page targets over folder-drop when both apply.
        const pageHits = collisions.filter((c) => containerType(c.id) === 'page')
        if (pageHits.length > 0) collisions = pageHits
      }

      return collisions
    },
    [],
  )

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current
    if (!data) return
    setMirror(storeFolders)
    if (data.type === 'folder') {
      const folder = storeFolders.find((f) => f.id === e.active.id)
      if (folder) setActiveMeta({ kind: 'folder', folder })
    } else if (data.type === 'page') {
      const loc = locatePageInFolders(storeFolders, String(e.active.id))
      if (loc) {
        const folder = storeFolders[loc.folderIdx]
        const page = folder.pages[loc.pageIdx]
        setActiveMeta({
          kind: 'page',
          folderId: folder.id,
          pageId: page.id,
          title: page.title,
        })
      }
    }
  }

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const activeData = active.data.current
    if (!activeData || activeData.type !== 'page') return
    const overData = over.data.current
    if (!overData) return

    setMirror((prev) => {
      const base = prev ?? storeFolders
      const loc = locatePageInFolders(base, String(active.id))
      if (!loc) return prev
      const srcFolderId = base[loc.folderIdx].id

      let dstFolderId: string | undefined
      let insertBeforePageId: string | null = null
      if (overData.type === 'page') {
        dstFolderId = overData.folderId as string
        insertBeforePageId = String(over.id)
      } else if (overData.type === 'folder-drop') {
        dstFolderId = overData.folderId as string
        insertBeforePageId = null
      } else {
        return prev
      }
      if (srcFolderId === dstFolderId) return prev

      const dstIdx = findFolderIdx(base, dstFolderId)
      if (dstIdx === -1) return prev

      const next = base.map((f) => ({ ...f, pages: f.pages.slice() }))
      const src = next[loc.folderIdx]
      const dst = next[dstIdx]
      const [moved] = src.pages.splice(loc.pageIdx, 1)
      if (insertBeforePageId) {
        const beforeIdx = dst.pages.findIndex((p) => p.id === insertBeforePageId)
        dst.pages.splice(beforeIdx >= 0 ? beforeIdx : dst.pages.length, 0, moved)
      } else {
        dst.pages.push(moved)
      }
      return next
    })
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    const activeData = active.data.current

    setMirror((prev) => {
      const base = prev ?? storeFolders

      if (!over) {
        if (prev !== null) commitDndResult(base)
        return null
      }

      if (activeData?.type === 'folder') {
        if (active.id !== over.id) {
          const from = findFolderIdx(base, String(active.id))
          const to = findFolderIdx(base, String(over.id))
          if (from !== -1 && to !== -1) {
            const next = base.slice()
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            commitDndResult(next)
            return null
          }
        }
        if (prev !== null) commitDndResult(base)
        return null
      }

      if (activeData?.type === 'page') {
        const next = base.map((f) => ({ ...f, pages: f.pages.slice() }))
        const loc = locatePageInFolders(next, String(active.id))
        if (!loc) return null
        const overData = over.data.current
        if (
          overData?.type === 'page' &&
          overData.folderId === next[loc.folderIdx].id &&
          over.id !== active.id
        ) {
          const folder = next[loc.folderIdx]
          const to = folder.pages.findIndex((p) => p.id === over.id)
          if (to !== -1 && to !== loc.pageIdx) {
            const [moved] = folder.pages.splice(loc.pageIdx, 1)
            folder.pages.splice(to, 0, moved)
          }
        }
        commitDndResult(next)
        return null
      }

      return null
    })
    setActiveMeta(null)
  }

  const handleDragCancel = () => {
    setMirror(null)
    setActiveMeta(null)
  }

  if (renderedFolders.length === 0) {
    return (
      <div className="text-muted-foreground px-3 py-2 text-xs">
        No folders yet. Click <span className="font-medium">Add Folder</span> below to get started.
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={renderedFolders.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col">
          {renderedFolders.map((folder) => (
            <FolderItem key={folder.id} folder={folder} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeMeta?.kind === 'page' && (
          <div className="rounded-md bg-sidebar shadow-lg ring-1 ring-border px-3 py-1.5 text-base">
            {activeMeta.title || 'Untitled'}
          </div>
        )}
        {activeMeta?.kind === 'folder' && (
          <div className="rounded-md bg-sidebar shadow-lg ring-1 ring-border px-3 py-2 text-sm font-medium">
            {activeMeta.folder.name || 'Folder'}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
