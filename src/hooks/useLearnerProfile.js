import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { SCHEDULE } from '../lib/schedule'

/**
 * Zero-login learner profile persisted entirely in localStorage.
 *
 * Storage key contract:
 *   - learnerName       (string, empty until the learner sets it — the UI
 *                        shows a "Your name" placeholder rather than filler)
 *   - startDate         (ISO date string, e.g. "2026-01-15")
 *   - completedLessons  (JSON array of lesson ids)
 */

// Empty by default: a blank name reads as "not set yet" so the greeting can
// invite the learner to add theirs instead of showing a generic placeholder.
export const DEFAULT_NAME = ''

// Older builds seeded this filler name (and may have persisted it on reset),
// so returning learners still have it in storage. Treat it as "not set" so
// they get the friendly "Your name" prompt without having to clear anything.
const LEGACY_DEFAULT_NAME = 'ALX Tech Fellow'

const KEY_NAME = 'learnerName'
const KEY_START = 'startDate'
const KEY_COMPLETED = 'completedLessons'

// Only ids that still exist in the bundled schedule are valid — protects
// completedLessons if the curriculum is ever re-versioned.
const VALID_IDS = new Set(SCHEDULE.lessons.map((l) => l.id))

export function useLearnerProfile() {
  const [storedName, setLearnerName] = useLocalStorage(KEY_NAME, DEFAULT_NAME, { raw: true })
  // Coerce the legacy filler to empty so the placeholder greeting shows.
  const learnerName = storedName === LEGACY_DEFAULT_NAME ? '' : storedName
  const [startDate, setStartDate] = useLocalStorage(KEY_START, '', { raw: true })
  const [completedRaw, setCompletedRaw] = useLocalStorage(KEY_COMPLETED, [])

  // Guardrail: coerce whatever is in storage into a clean, deduplicated array
  // of known ids, so the visible count can never disagree with the percent.
  const completedLessons = useMemo(() => {
    const list = Array.isArray(completedRaw) ? completedRaw : []
    return Array.from(new Set(list.filter((id) => VALID_IDS.has(id))))
  }, [completedRaw])

  const completedSet = useMemo(() => new Set(completedLessons), [completedLessons])

  const toggleLesson = useCallback(
    (id) => {
      if (!VALID_IDS.has(id)) return
      setCompletedRaw((prev) => {
        const list = Array.isArray(prev) ? prev : []
        return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
      })
    },
    [setCompletedRaw],
  )

  const setLessonsCompleted = useCallback(
    (ids, completed) => {
      const target = new Set(ids.filter((id) => VALID_IDS.has(id)))
      setCompletedRaw((prev) => {
        const list = new Set(Array.isArray(prev) ? prev : [])
        for (const id of target) {
          if (completed) list.add(id)
          else list.delete(id)
        }
        return Array.from(list)
      })
    },
    [setCompletedRaw],
  )

  const updateName = useCallback(
    (name) => {
      setLearnerName((name || '').trim())
    },
    [setLearnerName],
  )

  const updateStartDate = useCallback(
    (iso) => {
      setStartDate(iso || '')
    },
    [setStartDate],
  )

  const resetProfile = useCallback(() => {
    setLearnerName(DEFAULT_NAME)
    setStartDate('')
    setCompletedRaw([])
  }, [setLearnerName, setStartDate, setCompletedRaw])

  return {
    learnerName,
    startDate,
    completedLessons,
    completedSet,
    updateName,
    updateStartDate,
    toggleLesson,
    setLessonsCompleted,
    resetProfile,
  }
}
