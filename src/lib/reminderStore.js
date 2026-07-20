/**
 * Mirrors a tiny, pre-composed reminder message into IndexedDB so the service
 * worker (which cannot read localStorage) can show it while the app is closed.
 * Fire-and-forget: any failure is silently ignored — reminders are an
 * enhancement, never a dependency.
 */
const DB_NAME = 'alx-pace'
const STORE = 'reminder'

export function saveReminderState(state) {
  if (typeof indexedDB === 'undefined') return
  try {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => {
      try {
        const tx = req.result.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put({ ...state, savedAt: Date.now() }, 'state')
        tx.oncomplete = () => req.result.close()
        tx.onerror = () => req.result.close()
      } catch {
        req.result.close()
      }
    }
  } catch {
    /* ignore */
  }
}
