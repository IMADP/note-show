import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAppStore, type Folder } from '@/store/use-app-store'

import { PageListItem } from './page-list-item'

export function FolderItem({ folder }: { folder: Folder }) {
  const navigate = useNavigate()
  const renameFolder = useAppStore((s) => s.renameFolder)
  const deleteFolder = useAppStore((s) => s.deleteFolder)
  const toggleCollapsed = useAppStore((s) => s.toggleFolderCollapsed)
  const addPageInFolder = useAppStore((s) => s.addPageInFolder)
  const beginEdit = useAppStore((s) => s.beginEdit)

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    data: { type: 'folder', folderId: folder.id },
  })

  const { setNodeRef: setDroppableRef, isOver: isFolderDropOver } = useDroppable({
    id: `folder-drop:${folder.id}`,
    data: { type: 'folder-drop', folderId: folder.id },
  })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (!isRenaming) return
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [isRenaming])

  const startRename = () => {
    setRenameValue(folder.name)
    setIsRenaming(true)
  }

  const commitRename = () => {
    const trimmed = renameValue.trim() || 'Untitled folder'
    if (trimmed !== folder.name) renameFolder(folder.id, trimmed)
    setIsRenaming(false)
  }

  const cancelRename = () => {
    setRenameValue(folder.name)
    setIsRenaming(false)
  }

  const handleAddPage = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation()
    const newId = addPageInFolder(folder.id)
    if (newId) {
      navigate(`/page/${newId}`)
      beginEdit(newId)
    }
  }

  const handleDeleteConfirmed = () => {
    deleteFolder(folder.id)
    setConfirmDeleteOpen(false)
  }

  const handleHeaderClick = () => {
    if (isRenaming) return
    toggleCollapsed(folder.id)
  }

  return (
    <div
      ref={setSortableRef}
      style={dragStyle}
      className={cn('flex flex-col', isDragging && 'z-10 opacity-70')}
    >
      <div
        ref={setDroppableRef}
        {...attributes}
        {...listeners}
        className={cn(
          'group/folder relative flex items-center gap-1 px-1 py-1 rounded-md ml-1 mt-1 transition-colors touch-none select-none cursor-pointer active:cursor-grabbing',
          isFolderDropOver && 'bg-primary/10 ring-1 ring-primary/40',
        )}
      >
        <button
          type="button"
          aria-label={folder.collapsed ? 'Expand folder' : 'Collapse folder'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            toggleCollapsed(folder.id)
          }}
          className="flex h-7 w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ChevronRight
            className={cn(
              'size-4 transition-transform duration-200 ease-out',
              !folder.collapsed && 'rotate-90',
            )}
          />
        </button>

        {isRenaming ? (
          <Input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitRename()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                cancelRename()
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-7 flex-1 text-sm font-medium"
          />
        ) : (
          <div
            onClick={handleHeaderClick}
            onDoubleClick={(e) => {
              e.stopPropagation()
              startRename()
            }}
            className="flex-1 truncate text-left text-sm font-medium text-muted-foreground px-1 py-0.5"
            title={folder.name}
          >
            {folder.name || 'Untitled folder'}
          </div>
        )}

        <button
          type="button"
          aria-label="Add page"
          title="Add page"
          tabIndex={isRenaming ? -1 : 0}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault()
            handleAddPage(e)
          }}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors',
            isRenaming
              ? 'pointer-events-none text-muted-foreground/40'
              : 'cursor-pointer text-muted-foreground/0 group-hover/folder:text-muted-foreground/80 hover:bg-sidebar-accent hover:text-foreground',
          )}
        >
          <Plus className="size-4" />
        </button>

        <button
          type="button"
          aria-label="Delete folder"
          title="Delete folder"
          tabIndex={isRenaming ? -1 : 0}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setConfirmDeleteOpen(true)
          }}
          className={cn(
            '-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors',
            isRenaming
              ? 'pointer-events-none text-muted-foreground/40'
              : 'cursor-pointer text-muted-foreground/0 group-hover/folder:text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive',
          )}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div
        className={cn(
          'ml-3 grid transition-[grid-template-rows] duration-200 ease-out',
          folder.collapsed
            ? 'grid-rows-[0fr] pointer-events-none'
            : 'grid-rows-[1fr]',
        )}
        aria-hidden={folder.collapsed}
      >
        <div className="overflow-hidden">
          <SortableContext
            items={folder.pages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-px">
              {folder.pages.map((p) => (
                <PageListItem key={p.id} page={p} folderId={folder.id} />
              ))}
            </ul>
          </SortableContext>
        </div>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this folder?</AlertDialogTitle>
            <AlertDialogDescription>
              {folder.pages.length === 0
                ? `"${folder.name || 'Untitled folder'}" will be removed.`
                : `"${folder.name || 'Untitled folder'}" and its ${folder.pages.length} page${folder.pages.length === 1 ? '' : 's'} will be removed. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
