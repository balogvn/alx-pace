import { parseCsv, forwardFill } from './csvParser.js'

/**
 * Pure curriculum-model builder. Takes raw CSV text and returns the normalized
 * schedule. Kept free of any bundler-specific imports so it runs identically in
 * the browser build and in a plain Node verification script.
 */

export const TOTAL_WEEKS = 14

// CSV column layout (see src/data/schedule.csv header row).
const COL_MODULE = 0
const COL_WEEK = 1
const COL_LESSON = 2
const COL_CYU = 3 // Check Your Understanding (Not Graded)
const COL_GRADED = 4 // Evaluation Quiz / Graded Test

/** Pull the first integer out of a "Week 7" style label. */
function parseWeekNumber(label) {
  const match = /(\d+)/.exec(label || '')
  return match ? parseInt(match[1], 10) : null
}

/** Split "DA-1: Data and AI Literacy Foundation" into code + title. */
function parseModule(raw) {
  const full = (raw || '').trim()
  const idx = full.indexOf(':')
  if (idx === -1) return { code: full, title: full, full }
  return {
    code: full.slice(0, idx).trim(),
    title: full.slice(idx + 1).trim(),
    full,
  }
}

/**
 * Classify a graded/evaluation cell so the UI can badge it correctly.
 * @returns {'exam'|'integrated-project'|'graded-test'|'graded'|null}
 */
function classifyGraded(text) {
  if (!text) return null
  const t = text.toLowerCase()
  if (t.includes('exam')) return 'exam'
  if (t.includes('integrated project')) return 'integrated-project'
  if (t.includes('graded test')) return 'graded-test'
  return 'graded'
}

/**
 * Kebab-case slug for stable, content-derived ids.
 * Strips accents/punctuation deterministically.
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 64)
}

/**
 * A graded cell often packs the project name and the graded-test name on two
 * lines. Keep the primary line as the title and the rest as a subtitle.
 */
function splitGraded(text) {
  const lines = String(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  return { title: lines[0], subtitle: lines.slice(1).join(' · '), lines }
}

/**
 * Build the normalized schedule from raw CSV text.
 * @param {string} csvText
 */
export function buildScheduleFromCsv(csvText) {
  const rawRows = parseCsv(csvText)

  // Find the header row deterministically instead of assuming a fixed offset —
  // guards against an extra/removed banner line at the top of the export.
  const headerIndex = rawRows.findIndex(
    (r) =>
      (r[COL_MODULE] || '').trim().toLowerCase() === 'module' &&
      (r[COL_WEEK] || '').trim().toLowerCase() === 'week',
  )
  const bodyRows = headerIndex === -1 ? rawRows : rawRows.slice(headerIndex + 1)

  // Forward-fill the merged Module and Week columns across continuation rows.
  const filled = forwardFill(bodyRows, [COL_MODULE, COL_WEEK])

  const lessons = []
  const idCounts = new Map()
  let sequence = 0

  for (const row of filled) {
    const lessonText = (row[COL_LESSON] ?? '').trim()
    const cyuText = (row[COL_CYU] ?? '').trim()
    const gradedText = (row[COL_GRADED] ?? '').trim()

    // Skip the blank separator rows between modules — nothing to track.
    if (!lessonText && !cyuText && !gradedText) continue

    const mod = parseModule(row[COL_MODULE])
    const week = parseWeekNumber(row[COL_WEEK])
    const gradedType = classifyGraded(gradedText)
    const gradedSplit = gradedText ? splitGraded(gradedText) : null

    // Content-derived id (module + week + title slug), NOT positional:
    // inserting or removing a CSV row cannot silently re-map another lesson's
    // saved completion state in localStorage. A numeric suffix disambiguates
    // exact-duplicate titles within the same week.
    const titleForId = lessonText || (gradedSplit ? gradedSplit.title : cyuText)
    const baseId = `${slugify(mod.code)}-w${week ?? 0}-${slugify(titleForId)}`
    const dupCount = idCounts.get(baseId) || 0
    idCounts.set(baseId, dupCount + 1)

    lessons.push({
      id: dupCount === 0 ? baseId : `${baseId}-${dupCount + 1}`,
      sequence,
      moduleCode: mod.code,
      moduleTitle: mod.title,
      moduleFull: mod.full,
      week,
      weekLabel: row[COL_WEEK] || (week ? `Week ${week}` : ''),
      // The primary, checkable label for this row.
      title: titleForId,
      lesson: lessonText,
      checkYourUnderstanding: cyuText || null,
      graded: gradedSplit,
      gradedType,
      isGraded: Boolean(gradedText),
    })
    sequence += 1
  }

  // Group into weeks (1..N) preserving lesson order.
  const weekMap = new Map()
  for (const lesson of lessons) {
    if (lesson.week == null) continue
    if (!weekMap.has(lesson.week)) {
      weekMap.set(lesson.week, {
        week: lesson.week,
        weekLabel: lesson.weekLabel,
        moduleCode: lesson.moduleCode,
        moduleTitle: lesson.moduleTitle,
        moduleFull: lesson.moduleFull,
        lessons: [],
        gradedItems: [],
      })
    }
    const bucket = weekMap.get(lesson.week)
    bucket.lessons.push(lesson)
    if (lesson.isGraded) bucket.gradedItems.push(lesson)
  }

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.week - b.week)

  // Group weeks into modules, preserving first-seen order.
  const moduleMap = new Map()
  for (const wk of weeks) {
    if (!moduleMap.has(wk.moduleCode)) {
      moduleMap.set(wk.moduleCode, {
        code: wk.moduleCode,
        title: wk.moduleTitle,
        full: wk.moduleFull,
        weeks: [],
      })
    }
    moduleMap.get(wk.moduleCode).weeks.push(wk)
  }
  const modules = Array.from(moduleMap.values()).map((m) => ({
    ...m,
    weekStart: m.weeks[0]?.week ?? null,
    weekEnd: m.weeks[m.weeks.length - 1]?.week ?? null,
  }))

  const maxWeek = weeks.length ? weeks[weeks.length - 1].week : TOTAL_WEEKS

  return {
    lessons,
    weeks,
    modules,
    totalLessons: lessons.length,
    totalGraded: lessons.filter((l) => l.isGraded).length,
    // The curriculum spans 14 weeks by design; fall back to the data-derived
    // maximum so the app never lies if the CSV is ever edited.
    weekCount: Math.max(TOTAL_WEEKS, maxWeek),
    maxWeek,
  }
}
