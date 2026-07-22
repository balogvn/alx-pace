import { parseISODate } from './pacing'

/** Human date ("15 Jul 2026" / "15 juil. 2026" / "١٥ يوليو ٢٠٢٦") for a Date or ISO string. */
export function formatHumanDate(value, locale = 'en') {
  const d = value instanceof Date ? value : parseISODate(value)
  if (!d) return String(value ?? '')
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
