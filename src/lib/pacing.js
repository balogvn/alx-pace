import { TOTAL_WEEKS } from './schedule'

/**
 * Deterministic pacing engine — pure functions, no side effects, no clock reads
 * except the one `now` you pass in. This keeps it trivially testable and means
 * the UI computes the same answer every render for a given (startDate, now).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Normalize a Date to local midnight so day math is not skewed by the time of
 * day. Two dates on the same calendar day => 0 elapsed days.
 */
export function atMidnight(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Whole days from `start` to `now` (can be negative for future start dates). */
export function daysBetween(start, now) {
  const a = atMidnight(start).getTime()
  const b = atMidnight(now).getTime()
  return Math.round((b - a) / MS_PER_DAY)
}

/**
 * Parse an ISO date string (YYYY-MM-DD) as a *local* date.
 *
 * `new Date('2026-01-15')` parses as UTC midnight, which can shift a day in
 * negative timezones. Splitting the parts keeps the calendar date intact.
 * Returns null for empty/invalid input (a defensive guardrail).
 */
export function parseISODate(value) {
  if (!value || typeof value !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const d = new Date(year, month - 1, day)
  // Reject impossible dates like 2026-02-31 that JS would silently roll over.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null
  }
  return d
}

/** Format a Date as a local ISO date string (YYYY-MM-DD) for <input type=date>. */
export function toISODateString(date) {
  const d = atMidnight(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Compute the learner's pacing status.
 *
 * Implements the spec formula exactly:
 *   elapsedDays  = today - startDate
 *   currentWeek  = min(14, max(1, floor(elapsedDays / 7) + 1))
 *
 * @param {string|Date|null} startDateInput  ISO string or Date
 * @param {Date} [now=new Date()]            injectable "today" for testing
 * @returns {{
 *   status: 'no-start-date'|'future'|'active'|'completed',
 *   startDate: Date|null,
 *   elapsedDays: number,
 *   daysUntilStart: number,
 *   currentWeek: number,
 *   rawWeek: number,
 *   totalWeeks: number,
 *   daysRemaining: number,
 * }}
 */
export function computePacing(startDateInput, now = new Date()) {
  const startDate = startDateInput instanceof Date ? startDateInput : parseISODate(startDateInput)
  const today = atMidnight(now)

  // Guardrail: no valid start date yet -> onboarding state.
  if (!startDate) {
    return {
      status: 'no-start-date',
      startDate: null,
      elapsedDays: 0,
      daysUntilStart: 0,
      currentWeek: 1,
      rawWeek: 1,
      totalWeeks: TOTAL_WEEKS,
      daysRemaining: TOTAL_WEEKS * 7,
    }
  }

  const elapsedDays = daysBetween(startDate, today)

  // Guardrail: start date is in the future -> countdown state.
  if (elapsedDays < 0) {
    return {
      status: 'future',
      startDate,
      elapsedDays,
      daysUntilStart: Math.abs(elapsedDays),
      currentWeek: 1,
      rawWeek: 0,
      totalWeeks: TOTAL_WEEKS,
      daysRemaining: TOTAL_WEEKS * 7,
    }
  }

  const rawWeek = Math.floor(elapsedDays / 7) + 1
  const currentWeek = Math.min(TOTAL_WEEKS, Math.max(1, rawWeek))
  const totalCourseDays = TOTAL_WEEKS * 7
  const daysRemaining = Math.max(0, totalCourseDays - elapsedDays)

  // Guardrail: past the final week -> graduation state.
  if (rawWeek > TOTAL_WEEKS) {
    return {
      status: 'completed',
      startDate,
      elapsedDays,
      daysUntilStart: 0,
      currentWeek: TOTAL_WEEKS,
      rawWeek,
      totalWeeks: TOTAL_WEEKS,
      daysRemaining: 0,
    }
  }

  return {
    status: 'active',
    startDate,
    elapsedDays,
    daysUntilStart: 0,
    currentWeek,
    rawWeek,
    totalWeeks: TOTAL_WEEKS,
    daysRemaining,
  }
}

/**
 * The planned "done by" date: the last day of Week 14 (start + 97 days,
 * since day 1 is the start date itself). Null when no valid start date.
 */
export function plannedEndDate(startDateInput) {
  const start = startDateInput instanceof Date ? startDateInput : parseISODate(startDateInput)
  if (!start) return null
  const end = atMidnight(start)
  end.setDate(end.getDate() + TOTAL_WEEKS * 7 - 1)
  return end
}

/**
 * Progress percentage from completed lesson ids.
 * @param {string[]|Set<string>} completed
 * @param {number} total
 * @returns {number} 0..100 (integer)
 */
export function progressPercent(completed, total) {
  if (!total) return 0
  const count = completed instanceof Set ? completed.size : (completed || []).length
  return Math.min(100, Math.round((count / total) * 100))
}
