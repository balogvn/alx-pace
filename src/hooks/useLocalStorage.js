import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Persisted state hook backed by localStorage.
 *
 * Defensive by design (Google Agentic principle: "Defensive Guardrails"):
 *   - Every read/write is wrapped in try/catch so a disabled/full/private-mode
 *     storage never crashes the app — it just falls back to in-memory state
 *     (a warning is logged, since the change won't survive a reload).
 *   - Corrupt JSON falls back to the default value instead of throwing.
 *   - `raw: true` stores plain strings (no JSON quotes) — used for the exact
 *     localStorage key contract in the spec (learnerName, startDate).
 *
 * The state updater passed to React is always a plain value: functional
 * updates are resolved against a ref *before* setState, and the storage write
 * happens outside the updater. This keeps the updater pure, so StrictMode's
 * double-invocation cannot double-fire the side effect.
 *
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @param {{ raw?: boolean }} [options]
 * @returns {[T, (value: T | ((prev: T) => T)) => void, () => void]}
 */
export function useLocalStorage(key, defaultValue, options = {}) {
  const { raw = false } = options
  const keyRef = useRef(key)
  keyRef.current = key

  const read = useCallback(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) return defaultValue
      return raw ? stored : JSON.parse(stored)
    } catch {
      return defaultValue
    }
    // defaultValue intentionally omitted: we only want the first-mount default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, raw])

  const [value, setValue] = useState(read)

  // Mirror of the latest value so functional updates resolve synchronously
  // and compose correctly across consecutive set() calls in one tick.
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  const set = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(valueRef.current) : next
      try {
        if (resolved === undefined || resolved === null) {
          window.localStorage.removeItem(keyRef.current)
        } else {
          window.localStorage.setItem(keyRef.current, raw ? String(resolved) : JSON.stringify(resolved))
        }
      } catch (err) {
        // Storage unavailable (quota/private mode/blocked). Keep the in-memory
        // value so the session still works, but be explicit that it won't
        // survive a reload.
        console.warn(`[alx-pace] Could not persist "${keyRef.current}" — change is in-memory only.`, err)
      }
      valueRef.current = resolved
      setValue(resolved)
    },
    [raw],
  )

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(keyRef.current)
    } catch {
      /* ignore */
    }
    valueRef.current = defaultValue
    setValue(defaultValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep multiple open tabs in sync.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e) => {
      if (e.key !== keyRef.current) return
      if (e.newValue === null) {
        setValue(defaultValue)
        return
      }
      try {
        setValue(raw ? e.newValue : JSON.parse(e.newValue))
      } catch {
        /* ignore malformed cross-tab payload */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw])

  return [value, set, remove]
}
