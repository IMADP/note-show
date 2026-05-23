import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
        size="lg"
        isActive={isActive}
        onClick={handleClick}
        className={cn(
          'cursor-pointer pl-3 text-base',
          isActive &&
            'bg-primary/10 text-foreground font-medium hover:bg-primary/15 data-[active=true]:bg-primary/10 data-[active=true]:text-foreground',
        )}
      >
        <span className="truncate">{page.title || 'Untitled'}</span>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover
        aria-label="Delete page"
        title="Delete page"
        className="cursor-pointer peer-data-[size=lg]/menu-button:top-3.5 hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setConfirmDeleteOpen(true)
        }}
      >
        <Trash2 />
      </SidebarMenuAction>

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
