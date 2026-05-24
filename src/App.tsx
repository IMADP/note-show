import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AiRoute } from '@/features/ai/ai-route'
import { BrowserGate } from '@/features/browser-gate'
import { EmptyState } from '@/features/empty-state'
import { PageRoute } from '@/features/page/page-route'
import { AppSidebar } from '@/features/sidebar/app-sidebar'
import { isFileSystemAccessSupported } from '@/lib/file-io'
import { useGlobalShortcuts, useUnsavedGuard } from '@/lib/keyboard'
import { useAppStore } from '@/store/use-app-store'

function App() {
  useGlobalShortcuts()
  useUnsavedGuard()

  const tryRestoreLastFile = useAppStore((s) => s.tryRestoreLastFile)
  useEffect(() => {
    if (!isFileSystemAccessSupported()) return
    void tryRestoreLastFile()
  }, [tryRestoreLastFile])

  if (!isFileSystemAccessSupported()) {
    return <BrowserGate />
  }

  return (
    <TooltipProvider>
      <HashRouter>
        <Routes>
          <Route path="/ai" element={<AiRoute />} />
          <Route
            path="*"
            element={
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <Routes>
                    <Route path="/" element={<EmptyState />} />
                    <Route path="/page/:id" element={<PageRoute />} />
                  </Routes>
                </SidebarInset>
              </SidebarProvider>
            }
          />
        </Routes>
      </HashRouter>
      <Toaster
        position="bottom-left"
        offset={{ left: '1rem', bottom: '1rem' }}
        mobileOffset={{ left: '1rem', bottom: '1rem' }}
      />
    </TooltipProvider>
  )
}

export default App
