import { Target } from 'lucide-react'
import LessonRow from './LessonRow'

/**
 * "This Week's Focus" — the exact Module, Week and lessons the learner should
 * be working on right now, with inline checkboxes.
 */
export default function CurrentFocusCard({ week, completedSet, onToggle }) {
  if (!week) return null

  const done = week.lessons.filter((l) => completedSet.has(l.id)).length
  const total = week.lessons.length

  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-lime bg-white p-4 shadow-glow dark:bg-navy-900"
      aria-label={`This week's focus: ${week.weekLabel}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-lime text-navy-900">
            <Target size={20} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-cobalt-600 dark:text-lime">
              This Week's Focus
            </p>
            <h2 className="truncate text-base font-bold leading-tight">
              {week.weekLabel} · {week.moduleCode}
            </h2>
          </div>
        </div>
        <span className="flex-none rounded-full bg-navy-900/5 px-2.5 py-1 text-xs font-bold tabular-nums dark:bg-white/10">
          {done}/{total}
        </span>
      </div>

      <p className="mb-3 text-sm font-medium text-ink-soft dark:text-paper/75">{week.moduleTitle}</p>

      <ul className="-mx-1 space-y-0.5">
        {week.lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            checked={completedSet.has(lesson.id)}
            onToggle={onToggle}
            highlight
          />
        ))}
      </ul>
    </section>
  )
}
