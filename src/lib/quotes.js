/**
 * Daily motivational lines (original, ALX-toned). The pick is deterministic —
 * keyed off the day of the year — so every learner sees the same quote all
 * day and it never flickers between renders.
 */
export const QUOTES = [
  'Discipline is choosing the rep you don’t feel like doing.',
  'Small consistent steps beat rare heroic sprints.',
  'Show up today. Momentum handles tomorrow.',
  'Hard things shrink when you start them.',
  'You don’t need motivation to open one lesson.',
  'Future you is built one checkbox at a time.',
  'Progress loves a schedule.',
  'Done today beats perfect someday.',
  'Every expert was once on Week 1.',
  'Consistency is a superpower anyone can have.',
  'Grit means returning after an off day.',
  'One lesson closer is still closer.',
  'The streak you keep is the skill you keep.',
  'Your pace, your path — just keep moving.',
]

/** Day-of-year (1..366) for a local date. */
function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / (24 * 60 * 60 * 1000))
}

/** Deterministic quote of the day. */
export function quoteForDate(date = new Date()) {
  return QUOTES[dayOfYear(date) % QUOTES.length]
}
