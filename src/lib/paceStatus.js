/**
 * "Where am I?" engine — pure and deterministic, like the rest of the model.
 *
 * Definitions:
 *   - A lesson is DUE if it belongs to a week strictly before the current one
 *     (the current week is still in progress, so it is never "late").
 *   - behindCount = due lessons not yet completed.
 *   - aheadCount  = completed lessons in weeks after the current one.
 *   - status: 'behind' wins over 'ahead' (catch-up first), else 'on-track'.
 */
export function computePaceStatus(schedule, completedSet, pacing) {
  if (pacing.status !== 'active') return null

  const week = pacing.currentWeek

  let behindCount = 0
  let aheadCount = 0
  for (const lesson of schedule.lessons) {
    if (lesson.week == null) continue
    const done = completedSet.has(lesson.id)
    if (lesson.week < week && !done) behindCount += 1
    if (lesson.week > week && done) aheadCount += 1
  }

  const thisWeek = schedule.weeks.find((w) => w.week === week) || null
  const weekTotal = thisWeek ? thisWeek.lessons.length : 0
  const weekDone = thisWeek ? thisWeek.lessons.filter((l) => completedSet.has(l.id)).length : 0
  const gradedLeft = thisWeek
    ? thisWeek.gradedItems.filter((l) => !completedSet.has(l.id)).length
    : 0

  return {
    status: behindCount > 0 ? 'behind' : aheadCount > 0 ? 'ahead' : 'on-track',
    week,
    totalWeeks: pacing.totalWeeks,
    behindCount,
    aheadCount,
    weekDone,
    weekTotal,
    gradedLeft,
  }
}
