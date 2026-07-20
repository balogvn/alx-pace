/**
 * ALX motivational slogans. The pick is deterministic (keyed off the week
 * number) so it never flickers between renders within the same week.
 */
export const SLOGANS = [
  'Do Hard Things',
  'Grit in Progress',
  'Show Up. Level Up.',
  'Consistency Compounds',
  'Learn. Build. Repeat.',
  'Progress Over Perfection',
  'Small Steps, Big Data',
  'Earned, Not Given',
]

/** Deterministic slogan for a given week (1-based). */
export function sloganForWeek(week) {
  const idx = ((Math.max(1, week) - 1) % SLOGANS.length + SLOGANS.length) % SLOGANS.length
  return SLOGANS[idx]
}
