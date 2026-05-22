import { useEffect } from 'react'

import { isDraftDirty, useAppStore } from '@/store/use-app-store'

export function useGlobalShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key !== 's' && key !== 'enter') return

      const { mode, saveEdit } = useAppStore.getState()
      if (mode !== 'edit') return

      e.preventDefault()
      void saveEdit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}

export function useUnsavedGuard() {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDraftDirty(useAppStore.getState())) return
      e.preventDefault()
      // Older browsers still require this string; modern Chromium ignores its content.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])
}
