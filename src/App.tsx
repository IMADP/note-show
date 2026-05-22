import { HashRouter, Route, Routes } from 'react-router-dom'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { BrowserGate } from '@/features/browser-gate'
import { EmptyState } from '@/features/empty-state'
import { PageRoute } from '@/features/page/page-route'
import { AppSidebar } from '@/features/sidebar/app-sidebar'
import { isFileSystemAccessSupported } from '@/lib/file-io'
import { useGlobalShortcuts, useUnsavedGuard } from '@/lib/keyboard'

function App() {
  useGlobalShortcuts()
  useUnsavedGuard()

  if (!isFileSystemAccessSupported()) {
    return <BrowserGate />
  }

  return (
    <TooltipProvider>
      <HashRouter>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Routes>
              <Route path="/" element={<EmptyState />} />
              <Route path="/page/:id" element={<PageRoute />} />
            </Routes>
          </SidebarInset>
        </SidebarProvider>
      </HashRouter>
      <Toaster />
    </TooltipProvider>
  )
}

export default App
