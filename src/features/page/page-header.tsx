import { useEffect, useRef, useState } from 'react'
import { Moon, Pencil, Save, Sun, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTheme } from '@/lib/theme'
import { isDraftDirty, useAppStore, type Page } from '@/store/use-app-store'

import { DiscardDialog } from './discard-dialog'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
      </TooltipContent>
    </Tooltip>
  )
}

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
  const titleRef = useRef<HTMLInputElement>(null)

  const isEditingThis = mode === 'edit' && editingId === page.id

  useEffect(() => {
    if (!isEditingThis) return
    const el = titleRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [isEditingThis, editingId])

  if (!isEditingThis) {
    return (
      <div className="flex items-center justify-between h-[49px] border-b px-6">
        <h1 className="text-lg font-medium">{page.title || 'Untitled'}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => beginEdit(page.id)}>
            <Pencil />
            Edit
          </Button>
          <ThemeToggle />
        </div>
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
        ref={titleRef}
        value={draft?.title ?? ''}
        onChange={(e) => updateDraft({ title: e.target.value })}
        placeholder="Untitled"
        className="max-w-md text-base font-medium"
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleCancel}>
          <X />
          Cancel
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => void saveEdit()}>
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
        <ThemeToggle />
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
