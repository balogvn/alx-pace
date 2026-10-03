import { useEffect, useMemo, useState } from 'react'
import { getWeek } from './lib/schedule'
import { computePacing, progressPercent } from './lib/pacing'
import { computePaceStatus } from './lib/paceStatus'
import { saveReminderState } from './lib/reminderStore'
import { trackAppOpen, trackPacingDaily } from './lib/analytics'
import { useLang } from './i18n/LanguageContext'
import { useLearnerProfile } from './hooks/useLearnerProfile'
import { useTheme } from './hooks/useTheme'

import AlxLogo from './components/AlxLogo'
import PaceStatusCard from './components/PaceStatusCard'
import ForecastCard from './components/ForecastCard'
import PersonalizationWidget from './components/PersonalizationWidget'
import ProgramPicker from './components/ProgramPicker'
import ProgressBar from './components/ProgressBar'
import CurrentFocusCard from './components/CurrentFocusCard'
import GradedMilestonesAlert from './components/GradedMilestonesAlert'
import WeekAccordion from './components/WeekAccordion'
import CountdownState from './components/CountdownState'
import GraduationState from './components/GraduationState'
import StartDatePrompt from './components/StartDatePrompt'
import Footer from './components/Footer'

export default function App() {
  const { t } = useLang()
  const { theme, toggle: toggleTheme } = useTheme()
  const {
    program,
    schedule,
    learnerName,
    startDate,
    completedLessons,
    completedSet,
    updateProgram,
    updateName,
    updateStartDate,
    toggleLesson,
    setLessonsCompleted,
    resetProfile,
  } = useLearnerProfile()

  // The picker shows until a program is chosen, and again whenever the
  // learner taps "change" on the program row.
  const [pickingProgram, setPickingProgram] = useState(false)
  const showPicker = !schedule || pickingProgram
  const selectProgram = (id) => {
    updateProgram(id)
    setPickingProgram(false)
  }

  const programName = program ? t.programs[program] : ''

  // "Today" as state so pacing advances while the tab stays open: a minute
  // tick that only commits (and re-renders) when the calendar day changes.
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => {
      setToday((prev) => {
        const next = new Date()
        return next.toDateString() === prev.toDateString() ? prev : next
      })
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  // Deterministic pacing: pure function of (startDate, today, program timeline).
  const pacing = useMemo(
    () => computePacing(startDate, today, schedule),
    [startDate, today, schedule],
  )

  const currentWeek = getWeek(schedule, pacing.currentWeek)
  const firstWeek = schedule?.weeks[0] ?? null
  const totalLessons = schedule?.totalLessons ?? 0

  const completedCount = completedLessons.length
  const percent = progressPercent(completedSet, totalLessons)
  const gradedDone = useMemo(
    () =>
      schedule ? schedule.lessons.filter((l) => l.isGraded && completedSet.has(l.id)).length : 0,
    [schedule, completedSet],
  )

  const { status } = pacing

  const paceStatus = useMemo(
    () => (schedule ? computePaceStatus(schedule, completedSet, pacing, today) : null),
    [schedule, completedSet, pacing, today],
  )

  // Anonymous usage tallies (no-ops until GOATCOUNTER_SITE is configured).
  useEffect(() => {
    trackAppOpen()
  }, [])
  useEffect(() => {
    trackPacingDaily(paceStatus, program)
  }, [paceStatus, program])

  // Mirror a pre-composed reminder message into IndexedDB (in the learner's
  // language) so the service worker can show it while the app is closed.
  useEffect(() => {
    if (status !== 'active' || !paceStatus) return
    const s = paceStatus
    const body = s.isBuffer
      ? t.reminderBuffer(s.behindCount)
      : s.status === 'behind'
        ? t.reminderBehind(s.behindCount, s.gradedLeft)
        : s.gradedLeft > 0
          ? t.reminderGraded(s.gradedLeft)
          : t.reminderOnTrack(s.weekTotal - s.weekDone)
    saveReminderState({ title: t.reminderTitle(s.week, s.totalWeeks), body })
  }, [status, paceStatus, t])

  // Installed-app icon badge: how many items are left in the current week.
  // Supported on Android/desktop Chromium and iOS 16.4+ home-screen apps;
  // silently a no-op everywhere else.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) return
    const left = status === 'active' && currentWeek
      ? currentWeek.lessons.filter((l) => !completedSet.has(l.id)).length
      : 0
    if (left > 0) navigator.setAppBadge(left).catch(() => {})
    else navigator.clearAppBadge?.().catch(() => {})
  }, [status, currentWeek, completedSet])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-6 pt-5 sm:px-5">
      {/* Brand bar */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlxLogo className="h-7 w-auto text-ink dark:text-paper" />
          <div className="border-s border-ink/15 ps-3 leading-none dark:border-white/20">
            <p className="text-sm font-bold tracking-tight">Pace</p>
            <p className="text-[11px] font-medium text-ink-mute dark:text-paper/70">
              {t.tagline(programName)}
            </p>
          </div>
        </div>
        {schedule && (
          <span className="alx-chip bg-lime-300 text-navy-900">{t.trackChip(schedule.totalWeeks)}</span>
        )}
      </header>

      <main className="animate-fade-up space-y-4">
        <PersonalizationWidget
          learnerName={learnerName}
          startDate={startDate}
          pacing={pacing}
          schedule={schedule}
          programName={programName}
          onUpdateName={updateName}
          onUpdateStartDate={updateStartDate}
          onChangeProgram={() => setPickingProgram(true)}
        />

        {showPicker ? (
          <ProgramPicker
            program={program}
            onSelect={selectProgram}
            onCancel={schedule ? () => setPickingProgram(false) : undefined}
          />
        ) : (
          <>
            {/* Where-you're-at message: behind / on-track / ahead + daily quote */}
            {status === 'active' && <PaceStatusCard paceStatus={paceStatus} today={today} />}

            {/* State machine: onboarding → future → active → completed */}
            {status === 'no-start-date' && (
              <StartDatePrompt
                onSetStartDate={updateStartDate}
                schedule={schedule}
                programName={programName}
              />
            )}

            {status === 'future' && (
              <CountdownState
                pacing={pacing}
                firstWeek={firstWeek}
                schedule={schedule}
                programName={programName}
              />
            )}

            {status === 'completed' && (
              <GraduationState
                completedCount={completedCount}
                totalLessons={totalLessons}
                gradedDone={gradedDone}
                totalGraded={schedule.totalGraded}
                totalWeeks={schedule.totalWeeks}
              />
            )}

            {/* Progress + focus are shown whenever there is a timeline to pace. */}
            {(status === 'active' || status === 'completed' || status === 'no-start-date') && (
              <ProgressBar completed={completedCount} total={totalLessons} percent={percent} />
            )}

            {status === 'active' && (
              <>
                <ForecastCard paceStatus={paceStatus} />
                <CurrentFocusCard
                  week={currentWeek}
                  completedSet={completedSet}
                  onToggle={toggleLesson}
                  catchUp={paceStatus?.behindItems}
                />
                {!currentWeek?.isBuffer && (
                  <GradedMilestonesAlert week={currentWeek} completedSet={completedSet} />
                )}
              </>
            )}

            {/* Keyed by program so switching re-opens the new current week. */}
            <WeekAccordion
              key={program}
              schedule={schedule}
              completedSet={completedSet}
              currentWeek={pacing.currentWeek}
              onToggle={toggleLesson}
              onSetWeek={setLessonsCompleted}
            />
          </>
        )}

        <Footer
          theme={theme}
          onToggleTheme={toggleTheme}
          onReset={resetProfile}
          programName={programName}
        />
      </main>
    </div>
  )
}
