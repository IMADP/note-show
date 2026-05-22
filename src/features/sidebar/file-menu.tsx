import { AlertTriangle, ChevronDown, FileText, FilePlus, FolderOpen } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { useAppStore } from '@/store/use-app-store'

export function FileMenu() {
  const fileName = useAppStore((s) => s.fileName)
  const openFile = useAppStore((s) => s.openFile)
  const createFile = useAppStore((s) => s.createFile)

  const noFile = !fileName
  const Icon = noFile ? AlertTriangle : FileText

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          title={
            noFile ? 'No file open — changes will be lost on refresh.' : undefined
          }
          className={
            noFile
              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-900 data-[state=open]:bg-amber-200 data-[state=open]:text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60 dark:hover:text-amber-100 dark:data-[state=open]:bg-amber-900/60 dark:data-[state=open]:text-amber-100'
              : 'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          }
        >
          <Icon />
          <span className="truncate">{fileName ?? 'No file'}</span>
          <ChevronDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={() => void openFile()}>
          <FolderOpen />
          Open File…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void createFile()}>
          <FilePlus />
          New File…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
