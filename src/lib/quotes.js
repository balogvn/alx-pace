import { translations } from '../i18n/translations'

/**
 * Daily motivational lines, localized. The pick is deterministic — keyed off
 * the day of the year — so every learner sees the same quote all day and it
 * never flickers between renders.
 */

/** Day-of-year (1..366) for a local date. */
function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / (24 * 60 * 60 * 1000))
}

/** Deterministic quote of the day in the given language. */
export function quoteForDate(date = new Date(), lang = 'en') {
  const list = (translations[lang] || translations.en).quotes
  return list[dayOfYear(date) % list.length]
}
