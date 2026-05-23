// Persists the last-opened FileSystemFileHandle in IndexedDB so the app can
// attempt to reopen it on the next session. File handles are structured-
// cloneable so they survive IDB round-trips; localStorage cannot hold them.
//
// Permission state, however, generally does not survive across browser
// sessions — the store records the handle, but the consumer must still call
// queryPermission / requestPermission to actually read it back.

const DB_NAME = 'note-show'
const STORE_NAME = 'kv'
const KEY = 'last-file'
const DB_VERSION = 1

export type StoredFile = {
  handle: FileSystemFileHandle
  fileName: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveLastFile(file: StoredFile): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(file, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  db.close()
}

export async function loadLastFile(): Promise<StoredFile | null> {
  const db = await openDb()
  try {
    return await new Promise<StoredFile | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(KEY)
      req.onsuccess = () =>
        resolve((req.result as StoredFile | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function clearLastFile(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  db.close()
}
