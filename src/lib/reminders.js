import { PUSH_ENDPOINT, VAPID_PUBLIC_KEY } from './pushConfig'

/**
 * Reminder enablement — progressive enhancement, best mode available:
 *   'push'      Web Push via the configured endpoint (works app-closed,
 *               incl. iOS 16.4+ installs). Requires PUSH_ENDPOINT.
 *   'periodic'  Periodic Background Sync — the SW wakes locally and shows
 *               the last mirrored status. Chromium (Android/desktop) only.
 *   'granted'   Permission granted but no background mechanism on this
 *               browser — nothing fires while the app is closed.
 * Every step feature-detects; nothing here can break the app.
 */

/** Can this page even offer notifications? (iOS Safari: only when installed.) */
export function reminderSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )
}

function base64UrlToUint8Array(base64Url) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (ch) => ch.charCodeAt(0))
}

async function readyRegistration(timeoutMs = 4000) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('sw-timeout')), timeoutMs)),
  ])
}

/**
 * @returns {Promise<{ok: boolean, mode?: 'push'|'periodic'|'granted', reason?: string}>}
 */
export async function enableReminders() {
  if (!reminderSupported()) return { ok: false, reason: 'unsupported' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  let registration
  try {
    registration = await readyRegistration()
  } catch {
    // Dev server or SW not yet active — permission is granted, that's all
    // we can do here.
    return { ok: true, mode: 'granted' }
  }

  // Best: true Web Push (app-closed delivery everywhere it's supported).
  if (PUSH_ENDPOINT && VAPID_PUBLIC_KEY && 'pushManager' in registration) {
    try {
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
        }))
      const res = await fetch(`${PUSH_ENDPOINT}/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(subscription),
      })
      if (res.ok) return { ok: true, mode: 'push' }
    } catch {
      /* fall through to periodic sync */
    }
  }

  // Good: local periodic background sync (Chromium).
  if ('periodicSync' in registration) {
    try {
      await registration.periodicSync.register('alx-pace-reminder', {
        // Ask for roughly twice-weekly wake-ups; the browser decides the
        // actual cadence based on engagement.
        minInterval: 3 * 24 * 60 * 60 * 1000,
      })
      return { ok: true, mode: 'periodic' }
    } catch {
      /* fall through */
    }
  }

  return { ok: true, mode: 'granted' }
}
