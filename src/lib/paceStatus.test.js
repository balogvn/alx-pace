import { describe, it, expect } from 'vitest'
import { computePaceStatus } from './paceStatus'
import { toISODateString } from './pacing'

// Minimal hand-built schedule so counts are fully controlled.
const schedule = {
  totalLessons: 4,
  lessons: [
    { id: 'a', week: 1 },
    { id: 'b', week: 1 },
    { id: 'c', week: 2 },
    { id: 'd', week: 3 },
  ],
  weeks: [
    { week: 1, lessons: [{ id: 'a' }, { id: 'b' }], gradedItems: [{ id: 'b' }] },
    { week: 2, lessons: [{ id: 'c' }], gradedItems: [] },
    { week: 3, lessons: [{ id: 'd' }], gradedItems: [{ id: 'd' }] },
  ],
}

const activePacing = (over) => ({
  status: 'active',
  currentWeek: 2,
  totalWeeks: 14,
  elapsedDays: 7,
  startDate: new Date(2026, 2, 1),
  ...over,
})

describe('computePaceStatus', () => {
  it('returns null when pacing is not active', () => {
    expect(computePaceStatus(schedule, new Set(), { status: 'future' })).toBeNull()
  })

  it('flags "behind" for unfinished lessons in earlier weeks', () => {
    const s = computePaceStatus(schedule, new Set(['a']), activePacing(), new Date(2026, 2, 8))
    expect(s.status).toBe('behind')
    expect(s.behindCount).toBe(1) // 'b' from week 1 still open
  })

  it('flags "ahead" for lessons completed in later weeks', () => {
    const s = computePaceStatus(
      schedule,
      new Set(['a', 'b', 'c']),
      activePacing({ currentWeek: 1 }),
      new Date(2026, 2, 8),
    )
    expect(s.status).toBe('ahead')
    expect(s.aheadCount).toBe(1) // only 'c' (week 2) is a completed later-week lesson
  })

  it('flags "on-track" when caught up with nothing pulled forward', () => {
    const s = computePaceStatus(
      schedule,
      new Set(['a', 'b']),
      activePacing({ currentWeek: 1 }),
      new Date(2026, 2, 8),
    )
    expect(s.status).toBe('on-track')
  })

  it('computes pace and a projected finish date from real progress', () => {
    const now = new Date(2026, 2, 8)
    const s = computePaceStatus(schedule, new Set(['a']), activePacing(), now)
    // 1 lesson over 8 days-in => 0.875/wk, rounded to 0.9
    expect(s.pacePerWeek).toBe(0.9)
    expect(s.completedCount).toBe(1)
    expect(s.remaining).toBe(3)
    // perDay = 1/8; daysLeft = ceil(3 / 0.125) = 24
    const expected = new Date(now)
    expected.setDate(expected.getDate() + 24)
    expect(toISODateString(s.projectedFinish)).toBe(toISODateString(expected))
    expect(typeof s.finishDeltaDays).toBe('number')
  })

  it('has no projection before the first lesson is completed', () => {
    const s = computePaceStatus(schedule, new Set(), activePacing(), new Date(2026, 2, 8))
    expect(s.completedCount).toBe(0)
    expect(s.projectedFinish).toBeNull()
    expect(s.finishDeltaDays).toBeNull()
  })
})
