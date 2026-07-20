/**
 * Deterministic parser verification. Runs the *real* production parser against
 * the bundled CSV in plain Node (no bundler) and asserts the normalized model
 * is correct. Run with: `npm run parser:check`.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildScheduleFromCsv } from '../src/lib/scheduleModel.js'

const here = dirname(fileURLToPath(import.meta.url))
const csvPath = resolve(here, '../src/data/schedule.csv')
const csv = readFileSync(csvPath, 'utf8')

const model = buildScheduleFromCsv(csv)

let failures = 0
const check = (label, cond, detail = '') => {
  const ok = Boolean(cond)
  if (!ok) failures += 1
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`)
}

console.log('\n== ALX DA schedule parser verification ==\n')

check('parsed at least one lesson', model.lessons.length > 0, `${model.lessons.length} lessons`)
check('exactly 14 weeks', model.weeks.length === 14, `${model.weeks.length} weeks`)
check('week numbers are 1..14 in order', model.weeks.map((w) => w.week).join(',') === Array.from({ length: 14 }, (_, i) => i + 1).join(','))
check('exactly 4 modules', model.modules.length === 4, model.modules.map((m) => m.code).join(', '))

// Forward-fill: every content lesson must carry a module + week even though the
// CSV leaves those cells blank on continuation rows.
const orphanModule = model.lessons.filter((l) => !l.moduleCode)
const orphanWeek = model.lessons.filter((l) => l.week == null)
check('forward-fill: every lesson has a module', orphanModule.length === 0, `${orphanModule.length} orphans`)
check('forward-fill: every lesson has a week', orphanWeek.length === 0, `${orphanWeek.length} orphans`)

// A continuation row (blank Module cell in the source) still resolves to DA-1.
const week1 = model.weeks.find((w) => w.week === 1)
check('Week 1 belongs to DA-1', week1 && week1.moduleCode === 'DA-1', week1 && week1.moduleCode)
check('Week 1 has multiple lessons (continuation rows filled)', week1 && week1.lessons.length >= 5, week1 && `${week1.lessons.length} lessons`)

// Module boundaries.
const modByCode = Object.fromEntries(model.modules.map((m) => [m.code, m]))
check('DA-1 spans weeks 1–2', modByCode['DA-1']?.weekStart === 1 && modByCode['DA-1']?.weekEnd === 2)
check('DA-2 spans weeks 3–5', modByCode['DA-2']?.weekStart === 3 && modByCode['DA-2']?.weekEnd === 5)
check('DA-3 spans weeks 6–10', modByCode['DA-3']?.weekStart === 6 && modByCode['DA-3']?.weekEnd === 10)
check('DA-4 spans weeks 11–14', modByCode['DA-4']?.weekStart === 11 && modByCode['DA-4']?.weekEnd === 14)

// Multiline quoted cell: Week 3 has an Integrated Project whose graded cell
// packs the project name + graded test on two lines.
const week3 = model.weeks.find((w) => w.week === 3)
const ip = week3?.lessons.find((l) => l.gradedType === 'integrated-project')
check('multiline graded cell parsed (Week 3 Integrated Project)', Boolean(ip), ip && ip.graded?.title?.slice(0, 42))
check('multiline graded cell kept its second line as subtitle', Boolean(ip?.graded?.subtitle), ip?.graded?.subtitle?.slice(0, 42))

// Graded classification sanity.
check('some graded exams detected', model.lessons.some((l) => l.gradedType === 'exam'))
check('some graded tests detected', model.lessons.some((l) => l.gradedType === 'graded-test'))
check('graded total is consistent', model.totalGraded === model.lessons.filter((l) => l.isGraded).length, `${model.totalGraded} graded`)

// No blank separator rows leaked in.
const blanks = model.lessons.filter((l) => !l.lesson && !l.checkYourUnderstanding && !l.graded)
check('no blank separator rows leaked into lessons', blanks.length === 0, `${blanks.length} blanks`)

// Stable ids are unique and content-derived (not positional), so editing the
// CSV can never silently re-map saved completion state.
const ids = new Set(model.lessons.map((l) => l.id))
check('lesson ids are unique', ids.size === model.lessons.length, `${ids.size}/${model.lessons.length}`)
check(
  'lesson ids are content-derived slugs',
  model.lessons.every((l) => /^da-\d+-w\d+-[a-z0-9-]+$/.test(l.id)),
  model.lessons[3]?.id,
)

// The Week-12 source paste artifact (duplicated project title) stays fixed.
const w12 = model.weeks.find((w) => w.week === 12)
const w12graded = w12?.lessons.find((l) => l.isGraded)
check(
  'Week 12 graded title is not duplicated',
  w12graded && !/NdogoIntegrated/.test(w12graded.graded.title),
  w12graded?.graded?.title?.slice(0, 60),
)

console.log('\n-- Week-by-week summary --')
for (const w of model.weeks) {
  console.log(
    `  Week ${String(w.week).padStart(2)} · ${w.moduleCode} · ${w.lessons.length} lessons · ${w.gradedItems.length} graded`,
  )
}
console.log(`\nTotals: ${model.totalLessons} lessons, ${model.totalGraded} graded, ${model.modules.length} modules, ${model.weeks.length} weeks`)

if (failures > 0) {
  console.error(`\n❌ ${failures} check(s) failed.\n`)
  process.exit(1)
}
console.log('\n✅ All parser checks passed.\n')
