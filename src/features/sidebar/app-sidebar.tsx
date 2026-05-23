import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useAppStore } from '@/store/use-app-store'

import { FileMenu } from './file-menu'
import { PageList } from './page-list'

export function AppSidebar() {
  const navigate = useNavigate()
  const addPage = useAppStore((s) => s.addPage)
  const beginEdit = useAppStore((s) => s.beginEdit)

  const handleAdd = () => {
    const id = addPage()
    navigate(`/page/${id}`)
    beginEdit(id)
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <FileMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
          <SidebarGroupAction
            title="New page"
            aria-label="New page"
            onClick={handleAdd}
            className="right-[13px] cursor-pointer"
          >
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <PageList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
