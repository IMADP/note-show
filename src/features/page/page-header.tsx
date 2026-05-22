import { useState } from 'react'
import { Pencil, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isDraftDirty, useAppStore, type Page } from '@/store/use-app-store'

import { DiscardDialog } from './discard-dialog'

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform)
const MOD_KEY = isMac ? '⌘' : 'Ctrl'

export function PageHeader({ page }: { page: Page }) {
  const mode = useAppStore((s) => s.mode)
  const editingId = useAppStore((s) => s.editingId)
  const draft = useAppStore((s) => s.draft)
  const beginEdit = useAppStore((s) => s.beginEdit)
  const saveEdit = useAppStore((s) => s.saveEdit)
  const cancelEdit = useAppStore((s) => s.cancelEdit)
  const updateDraft = useAppStore((s) => s.updateDraft)

  const [discardOpen, setDiscardOpen] = useState(false)

  const isEditingThis = mode === 'edit' && editingId === page.id

  if (!isEditingThis) {
    return (
      <div className="flex items-center justify-between h-[49px] border-b px-6">
        <h1 className="text-base font-medium">{page.title || 'Untitled'}</h1>
        <Button size="sm" variant="outline" onClick={() => beginEdit(page.id)}>
          <Pencil />
          Edit
        </Button>
      </div>
    )
  }

  const handleCancel = () => {
    if (isDraftDirty(useAppStore.getState())) {
      setDiscardOpen(true)
    } else {
      cancelEdit()
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 h-[49px] border-b px-6">
      <Input
        value={draft?.title ?? ''}
        onChange={(e) => updateDraft({ title: e.target.value })}
        placeholder="Untitled"
        className="max-w-md text-base font-medium"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleCancel}>
          <X />
          Cancel
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" onClick={() => void saveEdit()}>
              <Save />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>
              Save{' '}
              <kbd className="ml-1 rounded bg-muted/40 px-1 py-px text-[10px] font-mono">
                {MOD_KEY}
              </kbd>
              <kbd className="ml-0.5 rounded bg-muted/40 px-1 py-px text-[10px] font-mono">
                S
              </kbd>
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
      <DiscardDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onConfirm={() => {
          setDiscardOpen(false)
          cancelEdit()
        }}
      />
    </div>
  )
}
