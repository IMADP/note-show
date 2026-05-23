import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isDraftDirty, useAppStore } from '@/store/use-app-store'

import { DiscardDialog } from './discard-dialog'

const INDENT = '  '

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform)
const MOD_KEY = isMac ? '⌘' : 'Ctrl'

export function PageEdit() {
  const draft = useAppStore((s) => s.draft)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const saveEdit = useAppStore((s) => s.saveEdit)
  const cancelEdit = useAppStore((s) => s.cancelEdit)

  const [discardOpen, setDiscardOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [])

  if (!draft) return null

  const handleCancel = () => {
    if (isDraftDirty(useAppStore.getState())) {
      setDiscardOpen(true)
    } else {
      cancelEdit()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.currentTarget
    const { selectionStart, selectionEnd, value } = el

    if (e.shiftKey) {
      const lineStart =
        value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
      if (value.slice(lineStart, lineStart + INDENT.length) === INDENT) {
        const next =
          value.slice(0, lineStart) + value.slice(lineStart + INDENT.length)
        updateDraft({ content: next })
        const shift = INDENT.length
        requestAnimationFrame(() => {
          el.selectionStart = Math.max(lineStart, selectionStart - shift)
          el.selectionEnd = Math.max(lineStart, selectionEnd - shift)
        })
      }
      return
    }

    const next =
      value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd)
    updateDraft({ content: next })
    const caret = selectionStart + INDENT.length
    requestAnimationFrame(() => {
      el.selectionStart = caret
      el.selectionEnd = caret
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-6">
        <div className="flex items-center gap-2">
          <Input
            ref={titleRef}
            value={draft.title ?? ''}
            onChange={(e) => updateDraft({ title: e.target.value })}
            placeholder="Untitled"
            className="h-11 max-w-md text-lg font-medium md:text-lg"
          />
          <div className="ml-auto flex items-center gap-2">
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
          </div>
        </div>
        <Textarea
          value={draft.content}
          onChange={(e) => updateDraft({ content: e.target.value })}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 resize-none text-[13.5px] leading-relaxed"
          style={{
            fontFamily:
              "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontFeatureSettings: "'calt', 'liga'",
          }}
        />
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
