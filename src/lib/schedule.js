import scheduleCsv from '../data/schedule.csv?raw'
import { buildScheduleFromCsv, TOTAL_WEEKS } from './scheduleModel'

/**
 * The bundled curriculum model.
 *
 * The CSV is imported with Vite's `?raw` suffix, so it is compiled straight
 * into the bundle: no network fetch, no loading state, works offline, and the
 * learner never touches a file input. Built once at module load — the CSV is
 * static, so there is no reason to recompute per render.
 */
export { TOTAL_WEEKS }

export const SCHEDULE = buildScheduleFromCsv(scheduleCsv)

/** Look up a single week object (or null if out of range). */
export function getWeek(weekNumber) {
  return SCHEDULE.weeks.find((w) => w.week === weekNumber) || null
}
