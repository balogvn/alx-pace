import { useEffect, useMemo, useState } from 'react'
import { SCHEDULE, getWeek } from './lib/schedule'
import { computePacing, progressPercent } from './lib/pacing'
import { computePaceStatus } from './lib/paceStatus'
import { saveReminderState } from './lib/reminderStore'
import { useLearnerProfile } from './hooks/useLearnerProfile'
import { useTheme } from './hooks/useTheme'

import AlxLogo from './components/AlxLogo'
import PaceStatusCard from './components/PaceStatusCard'
import PersonalizationWidget from './components/PersonalizationWidget'
import ProgressBar from './components/ProgressBar'
import CurrentFocusCard from './components/CurrentFocusCard'
import GradedMilestonesAlert from './components/GradedMilestonesAlert'
import WeekAccordion from './components/WeekAccordion'
import CountdownState from './components/CountdownState'
import GraduationState from './components/GraduationState'
import StartDatePrompt from './components/StartDatePrompt'
import Footer from './components/Footer'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const {
    learnerName,
    startDate,
    completedLessons,
    completedSet,
    updateName,
    updateStartDate,
    toggleLesson,
    setLessonsCompleted,
    resetProfile,
  } = useLearnerProfile()

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

  // Deterministic pacing: pure function of (startDate, today).
  const pacing = useMemo(() => computePacing(startDate, today), [startDate, today])

  const currentWeek = getWeek(pacing.currentWeek)
  const firstWeek = SCHEDULE.weeks[0]

  const completedCount = completedLessons.length
  const percent = progressPercent(completedSet, SCHEDULE.totalLessons)
  const gradedDone = useMemo(
    () => SCHEDULE.lessons.filter((l) => l.isGraded && completedSet.has(l.id)).length,
    [completedSet],
  )

  const { status } = pacing

  const paceStatus = useMemo(
    () => computePaceStatus(SCHEDULE, completedSet, pacing),
    [completedSet, pacing],
  )

  // Mirror a pre-composed reminder message into IndexedDB so the service
  // worker can show it as a notification while the app is closed.
  useEffect(() => {
    if (status !== 'active' || !paceStatus) return
    const s = paceStatus
    const body =
      s.status === 'behind'
        ? `${s.behindCount} ${s.behindCount === 1 ? 'lesson' : 'lessons'} to catch up · ${s.gradedLeft} graded due this week.`
        : s.gradedLeft > 0
          ? `${s.gradedLeft} graded ${s.gradedLeft === 1 ? 'item' : 'items'} due this week — keep your pace.`
          : `You're on track — ${s.weekTotal - s.weekDone} ${s.weekTotal - s.weekDone === 1 ? 'lesson' : 'lessons'} left this week.`
    saveReminderState({ title: `ALX Pace — Week ${s.week} of ${s.totalWeeks}`, body })
  }, [status, paceStatus])

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
          <div className="border-l border-ink/15 pl-3 leading-none dark:border-white/20">
            <p className="text-sm font-bold tracking-tight">Pace</p>
            <p className="text-[11px] font-medium text-ink-mute dark:text-paper/70">
              Data Analytics · Self-Pace
            </p>
          </div>
        </div>
        <span className="alx-chip bg-lime-300 text-navy-900">14-Week Track</span>
      </header>

      <main className="animate-fade-up space-y-4">
        <PersonalizationWidget
          learnerName={learnerName}
          startDate={startDate}
          pacing={pacing}
          onUpdateName={updateName}
          onUpdateStartDate={updateStartDate}
        />

        {/* Where-you're-at message: behind / on-track / ahead + daily quote */}
        {status === 'active' && <PaceStatusCard paceStatus={paceStatus} today={today} />}

        {/* State machine: onboarding → future → active → completed */}
        {status === 'no-start-date' && <StartDatePrompt onSetStartDate={updateStartDate} />}

        {status === 'future' && <CountdownState pacing={pacing} firstWeek={firstWeek} />}

        {status === 'completed' && (
          <GraduationState
            completedCount={completedCount}
            totalLessons={SCHEDULE.totalLessons}
            gradedDone={gradedDone}
            totalGraded={SCHEDULE.totalGraded}
          />
        )}

        {/* Progress + focus are shown whenever there is a timeline to pace. */}
        {(status === 'active' || status === 'completed' || status === 'no-start-date') && (
          <ProgressBar completed={completedCount} total={SCHEDULE.totalLessons} percent={percent} />
        )}

        {status === 'active' && (
          <>
            <CurrentFocusCard week={currentWeek} completedSet={completedSet} onToggle={toggleLesson} />
            <GradedMilestonesAlert week={currentWeek} completedSet={completedSet} />
          </>
        )}

        <WeekAccordion
          schedule={SCHEDULE}
          completedSet={completedSet}
          currentWeek={pacing.currentWeek}
          onToggle={toggleLesson}
          onSetWeek={setLessonsCompleted}
        />

        <Footer theme={theme} onToggleTheme={toggleTheme} onReset={resetProfile} />
      </main>
    </div>
  )
}
