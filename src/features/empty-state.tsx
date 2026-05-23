import { Navigate } from 'react-router-dom'

import { firstPageId, useAppStore } from '@/store/use-app-store'

export function EmptyState() {
  const firstId = useAppStore((s) => firstPageId(s.folders))
  if (firstId) {
    return <Navigate to={`/page/${firstId}`} replace />
  }
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-lg font-medium">Welcome to note-show</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a page to get started.
        </p>
      </div>
    </div>
  )
}
