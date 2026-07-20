import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { enableReminders, reminderSupported } from '../lib/reminders'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLang } from '../i18n/LanguageContext'

/**
 * Opt-in for weekly reminder notifications. Renders nothing on browsers with
 * no notification support (e.g. iOS Safari before Add to Home Screen).
 */
export default function ReminderToggle() {
  const { t } = useLang()
  const [mode, setMode] = useLocalStorage('alx-reminders', '', { raw: true })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!reminderSupported()) return null

  if (mode) {
    return (
      <p className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-xs font-semibold text-alxgreen-700 dark:text-alxgreen">
        <BellRing size={13} aria-hidden="true" />
        {mode === 'granted' ? t.notificationsAllowed : t.remindersOn}
      </p>
    )
  }

  const onEnable = async () => {
    setBusy(true)
    setError('')
    const result = await enableReminders()
    setBusy(false)
    if (result.ok) setMode(result.mode)
    else if (result.reason === 'denied') setError(t.remindersBlocked)
  }

  return (
    <div>
      <button
        type="button"
        onClick={onEnable}
        disabled={busy}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-ink/20 px-4 text-xs font-semibold text-ink-soft transition-colors hover:bg-navy-900/5 disabled:opacity-50 dark:border-white/20 dark:text-paper/80 dark:hover:bg-white/5"
      >
        <Bell size={13} aria-hidden="true" />
        {busy ? t.enabling : t.enableReminders}
      </button>
      {error && <p className="mt-1 text-[11px] text-violet-700 dark:text-violet-300">{error}</p>}
    </div>
  )
}
