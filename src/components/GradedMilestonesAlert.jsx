import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import GradedBadge from './GradedBadge'

/**
 * Prominently surfaces any Evaluation Quizzes / Graded Tests / Integrated
 * Projects due during the current week.
 */
export default function GradedMilestonesAlert({ week, completedSet }) {
  if (!week) return null
  const items = week.gradedItems || []

  if (items.length === 0) {
    return (
      <section className="alx-card flex items-center gap-3 border-alxgreen/25 bg-alxgreen/5">
        <CheckCircle2
          size={20}
          className="flex-none text-alxgreen-700 dark:text-alxgreen"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">
          No graded milestones this week — a great window to get ahead or reinforce the fundamentals.
        </p>
      </section>
    )
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border-2 border-violet/30 bg-violet/5 p-4"
      aria-label="Graded milestones due this week"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-violet text-white">
          <AlertTriangle size={18} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Graded Milestones
          </h2>
          <p className="text-xs text-ink-soft dark:text-paper/70">
            {items.length} due in {week.weekLabel} — these count toward your grade.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((lesson) => {
          const done = completedSet.has(lesson.id)
          return (
            <li
              key={lesson.id}
              className="flex items-start gap-2.5 rounded-xl bg-white/80 p-2.5 dark:bg-navy-950/50"
            >
              <GradedBadge type={lesson.gradedType} className="mt-0.5 flex-none" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold leading-snug ${done ? 'line-through opacity-60' : ''}`}>
                  {lesson.graded?.title || lesson.title}
                </p>
                {lesson.graded?.subtitle && (
                  <p className="mt-0.5 text-xs text-ink-soft dark:text-paper/70">
                    {lesson.graded.subtitle}
                  </p>
                )}
              </div>
              {done && (
                <CheckCircle2
                  size={18}
                  className="mt-0.5 flex-none text-alxgreen-700 dark:text-alxgreen"
                  aria-label="Completed"
                />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
