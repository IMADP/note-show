import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useMatch, useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
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
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { DiscardDialog } from '@/features/page/discard-dialog'
import { cn } from '@/lib/utils'
import { isDraftDirty, useAppStore, type Page } from '@/store/use-app-store'

export function PageListItem({
  page,
  folderId,
}: {
  page: Page
  folderId: string
}) {
  const match = useMatch('/page/:id')
  const activeId = match?.params.id
  const navigate = useNavigate()
  const deletePage = useAppStore((s) => s.deletePage)
  const renamePage = useAppStore((s) => s.renamePage)
  const cancelEdit = useAppStore((s) => s.cancelEdit)

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [pendingNavId, setPendingNavId] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(page.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const isActive = activeId === page.id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    data: { type: 'page', pageId: page.id, folderId },
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

  const navigateTo = (id: string) => navigate(`/page/${id}`)

  const handleClick = () => {
    if (isActive) return
    if (isDraftDirty(useAppStore.getState())) {
      setPendingNavId(page.id)
      return
    }
    navigateTo(page.id)
  }

  const startRename = () => {
    setRenameValue(page.title)
    setIsRenaming(true)
  }

  const commitRename = () => {
    const trimmed = renameValue.trim() || 'Untitled'
    if (trimmed !== page.title) renamePage(page.id, trimmed)
    setIsRenaming(false)
  }

  const cancelRename = () => {
    setRenameValue(page.title)
    setIsRenaming(false)
  }

  const findNeighborPageId = (): string | null => {
    const folders = useAppStore.getState().folders
    const flat: string[] = []
    for (const f of folders) {
      for (const p of f.pages) flat.push(p.id)
    }
    const idx = flat.indexOf(page.id)
    if (idx === -1) return null
    return flat[idx + 1] ?? flat[idx - 1] ?? null
  }

  const handleDelete = () => {
    const nextId = findNeighborPageId()
    deletePage(page.id)
    if (isActive) {
      navigate(nextId ? `/page/${nextId}` : '/')
    }
    setConfirmDeleteOpen(false)
  }

  return (
    <SidebarMenuItem
      ref={setNodeRef}
      style={dragStyle}
      className={cn('group/page', isDragging && 'z-10 opacity-70')}
    >
      {isRenaming ? (
        <div className="flex h-10 w-full items-center rounded-md pl-6 pr-2">
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
            className="h-7 text-base"
          />
        </div>
      ) : (
        <SidebarMenuButton
          size="md"
          isActive={isActive}
          onClick={handleClick}
          onDoubleClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            startRename()
          }}
          {...attributes}
          {...listeners}
          className={cn(
            'cursor-pointer active:cursor-grabbing touch-none select-none pl-6 pr-8 text-base',
            isActive &&
              'bg-primary/10 text-foreground font-medium hover:bg-primary/15 data-[active=true]:bg-primary/10 data-[active=true]:text-foreground',
          )}
        >
          <span className="truncate">{page.title || 'Untitled'}</span>
        </SidebarMenuButton>
      )}

      {!isRenaming && (
        <SidebarMenuAction
          showOnHover
          aria-label="Delete page"
          title="Delete page"
          className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setConfirmDeleteOpen(true)
          }}
        >
          <Trash2 />
        </SidebarMenuAction>
      )}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              "{page.title || 'Untitled'}" will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DiscardDialog
        open={pendingNavId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingNavId(null)
        }}
        onConfirm={() => {
          const target = pendingNavId
          setPendingNavId(null)
          cancelEdit()
          if (target) navigateTo(target)
        }}
      />
    </SidebarMenuItem>
  )
}
