import { useState } from 'react'
import { Moon, RotateCcw, Sun } from 'lucide-react'
import ReminderToggle from './ReminderToggle'

/**
 * Footer: theme toggle + a discreet-but-accessible, confirm-guarded
 * "Reset Profile Data" (readable contrast, 44px tap target).
 */
export default function Footer({ theme, onToggleTheme, onReset }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <footer className="mt-8 space-y-3 pb-2 text-center">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ReminderToggle />
        <button
          type="button"
          onClick={onToggleTheme}
          className="tap-target inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-navy-900/5 dark:border-white/20 dark:text-paper/80 dark:hover:bg-white/5"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      {confirming ? (
        <div className="mx-auto flex max-w-xs flex-col items-center gap-2 rounded-xl border border-violet/30 bg-violet/5 p-3">
          <p className="text-xs font-semibold text-ink dark:text-paper">
            Reset name, start date and all checked lessons? This can't be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onReset()
                setConfirming(false)
              }}
              className="tap-target rounded-lg bg-violet px-3 text-xs font-bold text-white"
            >
              Yes, reset
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="tap-target rounded-lg bg-navy-900/5 px-3 text-xs font-bold dark:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-medium text-ink-mute transition-colors hover:text-violet dark:text-paper/65 dark:hover:text-lime"
        >
          <RotateCcw size={12} aria-hidden="true" />
          Reset Profile Data
        </button>
      )}

      <p className="text-[11px] text-ink-mute dark:text-paper/60">
        ALX Data Analytics · Self-Pace Tracker · Your data stays on this device.
      </p>
    </footer>
  )
}
