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
  const restorable = useAppStore((s) => s.restorable)
  const restoreLastFile = useAppStore((s) => s.restoreLastFile)

  const noFile = !fileName
  const Icon = noFile ? AlertTriangle : FileText

  const title = noFile ? 'No File Selected' : fileName

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!restorable) return
    e.preventDefault()
    void restoreLastFile()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          onContextMenu={handleContextMenu}
          title={
            noFile ? 'No file open — changes will be lost on refresh.' : undefined
          }
          className={
            'h-[48px] cursor-pointer rounded-none px-4 ' +
            (noFile
              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-900 data-[state=open]:bg-amber-200 data-[state=open]:text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60 dark:hover:text-amber-100 dark:data-[state=open]:bg-amber-900/60 dark:data-[state=open]:text-amber-100'
              : 'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground')
          }
        >
          <Icon />
          <div className="flex min-w-0 flex-1 flex-col gap-px leading-tight">
            <span className="truncate text-sm font-medium">{title}</span>
            {noFile && (
              <span className="truncate text-[11px] opacity-80">
                {restorable
                  ? `Right-click to load '${restorable.fileName}'`
                  : 'Notes will not be saved'}
              </span>
            )}
          </div>
          <ChevronDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={6}
        className="w-64 rounded-md p-1"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onSelect={() => void openFile()}
          className="cursor-pointer rounded-sm px-3 py-3 text-sm focus:bg-neutral-200 dark:focus:bg-neutral-700"
        >
          <FolderOpen />
          Open File
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void createFile()}
          className="cursor-pointer rounded-sm px-3 py-3 text-sm focus:bg-neutral-200 dark:focus:bg-neutral-700"
        >
          <FilePlus />
          New File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
