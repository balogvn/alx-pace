import { describe, it, expect } from 'vitest'
import { buildScheduleFromCsv } from './scheduleModel'

// Small fixture exercising every normalization rule: a banner row, merged
// (forward-filled) Module/Week cells, a blank separator row, a quoted
// multi-line graded cell, and a duplicate lesson title in the same week.
const CSV = [
  'Self Paced Track,,,,',
  'Module,Week,Lessons,CYU,Eval',
  'DA-1: Foundations,Week 1,Intro,CYU A,',
  ',,Intro,CYU B,Graded Test: Intro Redo',
  ',Week 2,SQL Basics,,"Integrated Project: Part 1\nGraded Test: Part 1"',
  ',,,,',
  'DA-2: Reporting,Week 3,Dashboards,CYU D,Graded Exam: Final',
].join('\r\n')

describe('buildScheduleFromCsv', () => {
  const model = buildScheduleFromCsv(CSV)

  it('skips banner and blank separator rows', () => {
    expect(model.totalLessons).toBe(4)
  })

  it('groups into the right weeks and modules', () => {
    expect(model.weeks.map((w) => w.week)).toEqual([1, 2, 3])
    expect(model.modules.map((m) => m.code)).toEqual(['DA-1', 'DA-2'])
  })

  it('forward-fills merged Module and Week cells onto continuation rows', () => {
    const week2 = model.weeks.find((w) => w.week === 2)
    expect(week2.moduleCode).toBe('DA-1')
    const week1 = model.weeks.find((w) => w.week === 1)
    expect(week1.lessons).toHaveLength(2)
  })

  it('spans module week ranges correctly', () => {
    const da1 = model.modules.find((m) => m.code === 'DA-1')
    expect([da1.weekStart, da1.weekEnd]).toEqual([1, 2])
    const da2 = model.modules.find((m) => m.code === 'DA-2')
    expect([da2.weekStart, da2.weekEnd]).toEqual([3, 3])
  })

  it('gives duplicate titles in the same week distinct, stable ids', () => {
    const ids = model.lessons.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('da-1-w1-intro')
    expect(ids).toContain('da-1-w1-intro-2')
  })

  it('classifies graded cells', () => {
    const byId = Object.fromEntries(model.lessons.map((l) => [l.id, l]))
    expect(byId['da-1-w1-intro-2'].gradedType).toBe('graded-test')
    expect(byId['da-2-w3-dashboards'].gradedType).toBe('exam')
    const project = model.lessons.find((l) => l.gradedType === 'integrated-project')
    expect(project).toBeTruthy()
  })

  it('splits a multi-line graded cell into title + subtitle', () => {
    const project = model.lessons.find((l) => l.gradedType === 'integrated-project')
    expect(project.graded.title).toBe('Integrated Project: Part 1')
    expect(project.graded.subtitle).toBe('Graded Test: Part 1')
  })

  it('counts graded items consistently', () => {
    expect(model.totalGraded).toBe(model.lessons.filter((l) => l.isGraded).length)
  })
})
