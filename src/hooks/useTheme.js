import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

/**
 * Dark/light theme, persisted and reflected on <html class="dark">.
 * Defaults to light — matching alxafrica.com's light-first identity;
 * dark mode is the deep-navy variant of the same brand system.
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage('alx-theme', 'light', { raw: true })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#020B33' : '#F8F8F8')
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
