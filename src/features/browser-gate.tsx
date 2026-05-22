export function BrowserGate() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Unsupported browser</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          note-show uses the File System Access API to read and write a single
          JSON file on your hard drive. Your current browser does not support
          this API.
        </p>
        <p className="text-muted-foreground mt-3 text-sm">
          Please open this app in a recent Chromium-based browser — for example
          Chrome, Edge, Arc, Brave, or Opera.
        </p>
      </div>
    </div>
  )
}
