import { useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useMatch, useNavigate } from 'react-router-dom'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { DiscardDialog } from '@/features/page/discard-dialog'
import { cn } from '@/lib/utils'
import { isDraftDirty, useAppStore, type Page } from '@/store/use-app-store'

export function PageListItem({ page }: { page: Page }) {
  const match = useMatch('/page/:id')
  const activeId = match?.params.id
  const navigate = useNavigate()
  const deletePage = useAppStore((s) => s.deletePage)
  const cancelEdit = useAppStore((s) => s.cancelEdit)

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [pendingNavId, setPendingNavId] = useState<string | null>(null)

  const isActive = activeId === page.id

  const navigateTo = (id: string) => navigate(`/page/${id}`)

  const handleClick = () => {
    if (isActive) return
    if (isDraftDirty(useAppStore.getState())) {
      setPendingNavId(page.id)
      return
    }
    navigateTo(page.id)
  }

  const handleDelete = () => {
    const pages = useAppStore.getState().pages
    const idx = pages.findIndex((p) => p.id === page.id)
    const nextTarget = pages[idx + 1] ?? pages[idx - 1] ?? null
    deletePage(page.id)
    if (isActive) {
      navigate(nextTarget ? `/page/${nextTarget.id}` : '/')
    }
    setConfirmDeleteOpen(false)
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={handleClick}
        className={cn(
          'cursor-pointer',
          isActive &&
            'bg-primary/10 text-foreground font-medium hover:bg-primary/15 data-[active=true]:bg-primary/10 data-[active=true]:text-foreground',
        )}
      >
        <span className="truncate">{page.title || 'Untitled'}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover aria-label="Page actions">
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmDeleteOpen(true)
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
