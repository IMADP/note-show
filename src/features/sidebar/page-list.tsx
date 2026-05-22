import { SidebarMenu } from '@/components/ui/sidebar'
import { useAppStore } from '@/store/use-app-store'

import { PageListItem } from './page-list-item'

export function PageList() {
  const pages = useAppStore((s) => s.pages)
  if (pages.length === 0) {
    return (
      <div className="text-muted-foreground px-2 py-1 text-xs">No pages yet</div>
    )
  }
  return (
    <SidebarMenu>
      {pages.map((p) => (
        <PageListItem key={p.id} page={p} />
      ))}
    </SidebarMenu>
  )
}
