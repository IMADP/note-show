import { Plus } from 'lucide-react'
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
