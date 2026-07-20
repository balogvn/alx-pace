import { AlarmClock, CircleCheckBig, Quote, Zap } from 'lucide-react'
import { quoteForDate } from '../lib/quotes'

const VARIANTS = {
  behind: {
    Icon: AlarmClock,
    card: 'border-amber/40 bg-amber/10',
    chip: 'bg-amber text-navy-900',
    headline: (s) =>
      `Catch-up nudge: ${s.behindCount} ${s.behindCount === 1 ? 'lesson' : 'lessons'} from earlier weeks still open.`,
  },
  'on-track': {
    Icon: CircleCheckBig,
    card: 'border-cobalt/25 bg-tint dark:bg-white/5',
    chip: 'bg-cobalt text-white',
    headline: () => 'Right on pace — keep the streak alive.',
  },
  ahead: {
    Icon: Zap,
    card: 'border-alxgreen/30 bg-alxgreen/10',
    chip: 'bg-alxgreen text-navy-900',
    headline: (s) =>
      `You're ${s.aheadCount} ${s.aheadCount === 1 ? 'lesson' : 'lessons'} ahead of schedule. Excellent.`,
  },
}

/**
 * Glanceable "where you're at" message: behind / on-track / ahead, what's left
 * this week, and the deterministic quote of the day.
 */
export default function PaceStatusCard({ paceStatus, today = new Date() }) {
  if (!paceStatus) return null
  const v = VARIANTS[paceStatus.status]
  const { Icon } = v

  const parts = [
    `Week ${paceStatus.week} of ${paceStatus.totalWeeks}`,
    `${paceStatus.weekDone}/${paceStatus.weekTotal} done this week`,
  ]
  if (paceStatus.gradedLeft > 0) {
    parts.push(
      `${paceStatus.gradedLeft} graded ${paceStatus.gradedLeft === 1 ? 'item' : 'items'} still due`,
    )
  }

  return (
    <section className={`rounded-2xl border-2 p-4 ${v.card}`} aria-label="Your pacing status">
      <div className="flex items-start gap-2.5">
        <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${v.chip}`}>
          <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug">{v.headline(paceStatus)}</p>
          <p className="mt-0.5 text-xs font-medium text-ink-soft dark:text-paper/75">
            {parts.join(' · ')}
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 border-t border-navy-900/10 pt-2.5 text-xs italic text-ink-soft dark:border-white/10 dark:text-paper/75">
        <Quote size={12} className="mt-0.5 flex-none" aria-hidden="true" />
        <span>{quoteForDate(today)}</span>
      </p>
    </section>
  )
}
