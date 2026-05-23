import { History, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore } from '@/store/use-app-store'

import { FileMenu } from './file-menu'
import { PageList } from './page-list'

export function AppSidebar() {
  const navigate = useNavigate()
  const addPage = useAppStore((s) => s.addPage)
  const beginEdit = useAppStore((s) => s.beginEdit)
  const restorable = useAppStore((s) => s.restorable)
  const restoreLastFile = useAppStore((s) => s.restoreLastFile)

  const handleAdd = () => {
    const id = addPage()
    navigate(`/page/${id}`)
    beginEdit(id)
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-0">
        <div className="flex w-full items-stretch">
          <SidebarMenu className="min-w-0 flex-1">
            <SidebarMenuItem>
              <FileMenu />
            </SidebarMenuItem>
          </SidebarMenu>
          {restorable && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => void restoreLastFile()}
                  aria-label={`Reopen ${restorable.fileName}`}
                  className="flex h-[48px] w-12 shrink-0 cursor-pointer items-center justify-center border-l text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <History className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span>Reopen {restorable.fileName}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <PageList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleAdd}
              className="h-[48px] cursor-pointer justify-center rounded-none px-4 text-sm font-medium"
            >
              <Plus />
              <span>Add Page</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
