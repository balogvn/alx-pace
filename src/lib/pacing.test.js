import { describe, it, expect } from 'vitest'
import {
  parseISODate,
  daysBetween,
  toISODateString,
  computePacing,
  plannedEndDate,
  progressPercent,
} from './pacing'

const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

describe('parseISODate', () => {
  it('parses a valid ISO date as a local date', () => {
    const d = parseISODate('2026-01-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
  })

  it('returns null for empty, non-string, or malformed input', () => {
    expect(parseISODate('')).toBeNull()
    expect(parseISODate(null)).toBeNull()
    expect(parseISODate(undefined)).toBeNull()
    expect(parseISODate('not-a-date')).toBeNull()
  })

  it('rejects impossible calendar dates instead of rolling over', () => {
    expect(parseISODate('2026-02-31')).toBeNull()
    expect(parseISODate('2026-13-01')).toBeNull()
  })
})

describe('daysBetween', () => {
  it('is 0 for the same calendar day regardless of time', () => {
    expect(daysBetween(new Date(2026, 0, 1, 8), new Date(2026, 0, 1, 23))).toBe(0)
  })

  it('counts whole days forward and backward', () => {
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 8))).toBe(7)
    expect(daysBetween(new Date(2026, 0, 8), new Date(2026, 0, 1))).toBe(-7)
  })
})

describe('toISODateString', () => {
  it('round-trips a parsed ISO date', () => {
    expect(toISODateString(parseISODate('2026-07-22'))).toBe('2026-07-22')
  })
})

describe('computePacing', () => {
  it('reports no-start-date when there is no valid start', () => {
    const p = computePacing('', new Date(2026, 0, 1))
    expect(p.status).toBe('no-start-date')
    expect(p.currentWeek).toBe(1)
  })

  it('reports a future countdown when the start is ahead', () => {
    const start = '2026-03-10'
    const p = computePacing(start, new Date(2026, 2, 1))
    expect(p.status).toBe('future')
    expect(p.daysUntilStart).toBe(9)
  })

  it('is week 1 on the start day itself', () => {
    const p = computePacing('2026-03-01', new Date(2026, 2, 1))
    expect(p.status).toBe('active')
    expect(p.currentWeek).toBe(1)
    expect(p.elapsedDays).toBe(0)
  })

  it('advances one week every 7 elapsed days', () => {
    const start = new Date(2026, 2, 1)
    expect(computePacing('2026-03-01', addDays(start, 6)).currentWeek).toBe(1)
    expect(computePacing('2026-03-01', addDays(start, 7)).currentWeek).toBe(2)
    expect(computePacing('2026-03-01', addDays(start, 14)).currentWeek).toBe(3)
  })

  it('stays active through the last day of week 14 (elapsed 97)', () => {
    const start = new Date(2026, 2, 1)
    const p = computePacing('2026-03-01', addDays(start, 97))
    expect(p.status).toBe('active')
    expect(p.currentWeek).toBe(14)
  })

  it('flips to completed once past week 14 (elapsed 98)', () => {
    const start = new Date(2026, 2, 1)
    const p = computePacing('2026-03-01', addDays(start, 98))
    expect(p.status).toBe('completed')
    expect(p.currentWeek).toBe(14)
    expect(p.rawWeek).toBe(15)
  })
})

describe('plannedEndDate', () => {
  it('is 97 days after the start (last day of week 14)', () => {
    const start = new Date(2026, 2, 1)
    const end = plannedEndDate('2026-03-01')
    expect(toISODateString(end)).toBe(toISODateString(addDays(start, 97)))
  })

  it('is null without a valid start', () => {
    expect(plannedEndDate('')).toBeNull()
  })
})

describe('progressPercent', () => {
  it('computes a rounded percentage from an array or a Set', () => {
    expect(progressPercent(['a', 'b'], 4)).toBe(50)
    expect(progressPercent(new Set(['a', 'b']), 4)).toBe(50)
  })

  it('is 0 when total is 0 and clamps at 100', () => {
    expect(progressPercent(['a'], 0)).toBe(0)
    expect(progressPercent(['a', 'b', 'c'], 2)).toBe(100)
  })
})
