import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { SidebarMenu } from '@/components/ui/sidebar'
import { useAppStore } from '@/store/use-app-store'

import { PageListItem } from './page-list-item'

export function PageList() {
  const pages = useAppStore((s) => s.pages)
  const reorderPages = useAppStore((s) => s.reorderPages)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    reorderPages(String(active.id), String(over.id))
  }

  if (pages.length === 0) {
    return (
      <div className="text-muted-foreground px-2 py-1 text-xs">No pages yet</div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pages.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <SidebarMenu>
          {pages.map((p) => (
            <PageListItem key={p.id} page={p} />
          ))}
        </SidebarMenu>
      </SortableContext>
    </DndContext>
  )
}
