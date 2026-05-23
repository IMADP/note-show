import type { KeyboardEvent } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/store/use-app-store'

const INDENT = '  '

export function PageEdit() {
  const draft = useAppStore((s) => s.draft)
  const updateDraft = useAppStore((s) => s.updateDraft)

  if (!draft) return null

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.currentTarget
    const { selectionStart, selectionEnd, value } = el

    if (e.shiftKey) {
      const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
      if (value.slice(lineStart, lineStart + INDENT.length) === INDENT) {
        const next = value.slice(0, lineStart) + value.slice(lineStart + INDENT.length)
        updateDraft({ content: next })
        const shift = INDENT.length
        requestAnimationFrame(() => {
          el.selectionStart = Math.max(lineStart, selectionStart - shift)
          el.selectionEnd = Math.max(lineStart, selectionEnd - shift)
        })
      }
      return
    }

    const next = value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd)
    updateDraft({ content: next })
    const caret = selectionStart + INDENT.length
    requestAnimationFrame(() => {
      el.selectionStart = caret
      el.selectionEnd = caret
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-6">
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
  )
}
