import { TrendingUp } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

/**
 * Overall curriculum progress. Shows % complete and the raw count, with an
 * accessible progressbar role for screen readers.
 */
export default function ProgressBar({ completed, total, percent }) {
  const { t } = useLang()
  return (
    <section className="alx-card" aria-label={t.overallProgress}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt/10 text-cobalt-600 dark:bg-lime/15 dark:text-lime">
            <TrendingUp size={18} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide">{t.progressTitle}</h2>
            <p className="text-xs text-ink-soft dark:text-paper/70">
              {t.itemsComplete(completed, total)}
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold tabular-nums text-cobalt-600 dark:text-lime">
          {percent}%
        </span>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-full bg-navy-900/10 dark:bg-white/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t.progressAria(percent)}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-cobalt to-lime transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  )
}
