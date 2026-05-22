import { Navigate, useParams } from 'react-router-dom'

import { useAppStore } from '@/store/use-app-store'

import { PageEdit } from './page-edit'
import { PageHeader } from './page-header'
import { PageView } from './page-view'

export function PageRoute() {
  const { id } = useParams<{ id: string }>()
  const page = useAppStore((s) => s.pages.find((p) => p.id === id))
  const mode = useAppStore((s) => s.mode)
  const editingId = useAppStore((s) => s.editingId)

  if (!page) {
    return <Navigate to="/" replace />
  }

  const isEditingThis = mode === 'edit' && editingId === page.id

  return (
    <div className="flex h-full flex-col">
      <PageHeader page={page} />
      {isEditingThis ? <PageEdit /> : <PageView page={page} />}
    </div>
  )
}
