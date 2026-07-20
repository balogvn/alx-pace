import { translations } from '../i18n/translations'

/**
 * ALX motivational slogans, localized. The pick is deterministic (keyed off
 * the week number) so it never flickers between renders within the same week.
 */

/** Deterministic slogan for a given week (1-based) in the given language. */
export function sloganForWeek(week, lang = 'en') {
  const list = (translations[lang] || translations.en).slogans
  const idx = (((Math.max(1, week) - 1) % list.length) + list.length) % list.length
  return list[idx]
}
