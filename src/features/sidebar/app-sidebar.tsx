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
import { ThemeToggle } from '@/features/theme-toggle'
import { useAppStore } from '@/store/use-app-store'

import { FileMenu } from './file-menu'
import { FolderList } from './folder-list'

export function AppSidebar() {
  const addFolder = useAppStore((s) => s.addFolder)

  const handleAdd = () => {
    addFolder()
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
            <FolderList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter className="p-0">
        <div className="flex h-[48px] items-stretch">
          <ThemeToggle />
          <div className="min-w-0 flex-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleAdd}
                  className="h-[48px] cursor-pointer justify-center rounded-none px-4 text-sm font-medium"
                >
                  <span>Add Folder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
