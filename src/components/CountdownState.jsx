import { CalendarClock, Sparkles } from 'lucide-react'
import { sloganForWeek } from '../lib/slogans'

/** Shown when the learner's start date is in the future. */
export default function CountdownState({ pacing, firstWeek }) {
  const days = pacing.daysUntilStart
  return (
    <section className="alx-card border-cobalt/25 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cobalt/10 text-cobalt-600 dark:bg-lime/15 dark:text-lime">
        <CalendarClock size={28} strokeWidth={2.25} aria-hidden="true" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-cobalt-600 dark:text-lime">
        Get Ready
      </p>
      <h2 className="mt-1 text-2xl font-bold">
        Course begins in{' '}
        <span className="text-cobalt-600 dark:text-lime">
          {days} {days === 1 ? 'day' : 'days'}
        </span>
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft dark:text-paper/75">
        Your 14-week Data Analytics journey is queued up. {sloganForWeek(1)} — the countdown is part
        of the grind.
      </p>

      {firstWeek && (
        <div className="mt-4 rounded-xl bg-tint p-3 text-left dark:bg-white/5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft dark:text-paper/75">
            <Sparkles size={13} aria-hidden="true" /> First up · {firstWeek.weekLabel}
          </p>
          <p className="mt-1 text-sm font-semibold">
            {firstWeek.moduleCode}: {firstWeek.moduleTitle}
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink-soft dark:text-paper/75">
            {firstWeek.lessons.slice(0, 3).map((l) => (
              <li key={l.id} className="flex gap-2">
                <span className="text-cobalt-600 dark:text-lime" aria-hidden="true">
                  •
                </span>
                <span className="min-w-0">{l.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
