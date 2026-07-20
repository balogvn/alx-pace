import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, Flame, Pencil, Rocket, X } from 'lucide-react'
import { sloganForWeek } from '../lib/slogans'
import { toISODateString } from '../lib/pacing'

import portrait1 from '../assets/alx/banner-img1.webp'
import portrait2 from '../assets/alx/banner-img2.webp'
import portrait3 from '../assets/alx/banner-img3.webp'
import portrait4 from '../assets/alx/banner-img4.webp'
import portrait5 from '../assets/alx/banner-img5.webp'

const PORTRAITS = [portrait1, portrait2, portrait3, portrait4, portrait5]

/**
 * Top personalization widget styled after the alxafrica.com hero banner:
 * deep navy panel, lime accent, duotone learner portraits. Name and start
 * date are tap-to-edit without resetting progress.
 *
 * Drafts are seeded when an editor OPENS (not synced from props), so an
 * external update — cross-tab sync, reset — can never clobber in-flight typing.
 */
export default function PersonalizationWidget({
  learnerName,
  startDate,
  pacing,
  onUpdateName,
  onUpdateStartDate,
}) {
  const [editingName, setEditingName] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [dateDraft, setDateDraft] = useState('')
  const nameInputRef = useRef(null)

  // Focus management only — draft seeding happens in the open handlers.
  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editingName])

  const openNameEditor = () => {
    setNameDraft(learnerName)
    setEditingName(true)
  }
  const openDateEditor = () => {
    setDateDraft(startDate)
    setEditingDate(true)
  }

  const commitName = () => {
    onUpdateName(nameDraft)
    setEditingName(false)
  }
  const commitDate = () => {
    onUpdateStartDate(dateDraft)
    setEditingDate(false)
  }

  const week = pacing.currentWeek
  const slogan = sloganForWeek(week)
  const showWeekLine = pacing.status === 'active'

  const todayIso = toISODateString(new Date())

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-navy-900 p-5 text-paper shadow-card"
      aria-label="Your profile"
    >
      {/* Brand glows, echoing the site hero */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cobalt/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-lime/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        {/* Greeting + name */}
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              ref={nameInputRef}
              value={nameDraft}
              maxLength={40}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              className="w-full rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-lg font-bold text-white placeholder-white/40 outline-none focus:border-lime"
              placeholder="Your name"
              aria-label="Edit your name"
            />
            <button
              type="button"
              onClick={commitName}
              className="tap-target flex items-center justify-center rounded-xl bg-lime px-2 text-navy-900"
              aria-label="Save name"
            >
              <Check size={18} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              className="tap-target flex items-center justify-center rounded-xl bg-white/10 px-2 text-white"
              aria-label="Cancel"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
              Welcome back, <span className="text-lime">{learnerName}</span>!{' '}
              <Rocket className="inline h-5 w-5 -translate-y-0.5" aria-hidden="true" />
            </h1>
            <button
              type="button"
              onClick={openNameEditor}
              className="tap-target -mr-1 -mt-1 flex flex-none items-center justify-center rounded-xl text-white/70 hover:text-lime"
              aria-label="Edit your name"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}

        {/* Dynamic slogan line — lime chip like the site's category pills */}
        {showWeekLine && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-lime-300 px-3 py-1.5 text-sm font-semibold text-navy-900">
            <Flame size={15} aria-hidden="true" />
            <span>
              Week {week} — {slogan}!
            </span>
          </div>
        )}

        {/* Start date row */}
        <div className="mt-3 flex items-center gap-2 text-sm text-white/85">
          <CalendarDays size={16} className="flex-none" aria-hidden="true" />
          {editingDate ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="date"
                value={dateDraft}
                max="2100-12-31"
                onChange={(e) => setDateDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitDate()
                  if (e.key === 'Escape') setEditingDate(false)
                }}
                className="flex-1 rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-white outline-none focus:border-lime [color-scheme:dark]"
                aria-label="Edit your course start date"
              />
              <button
                type="button"
                onClick={commitDate}
                className="tap-target flex items-center justify-center rounded-xl bg-lime px-2 text-navy-900"
                aria-label="Save start date"
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setEditingDate(false)}
                className="tap-target flex items-center justify-center rounded-xl bg-white/10 px-2 text-white"
                aria-label="Cancel"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openDateEditor}
              className="group inline-flex min-h-[44px] items-center gap-1.5 rounded-md hover:text-lime"
            >
              <span>{startDate ? `Started ${formatHuman(startDate)}` : 'Set your start date'}</span>
              <Pencil size={13} className="opacity-70 group-hover:opacity-100" aria-hidden="true" />
              {!startDate && <span className="ml-1 text-white/60">(today: {formatHuman(todayIso)})</span>}
            </button>
          )}
        </div>

        {/* Duotone learner mosaic, straight from the ALX hero */}
        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {PORTRAITS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className={`h-12 w-12 flex-none rounded-xl object-cover ${i > 2 ? 'hidden sm:block' : ''}`}
            />
          ))}
          <div className="hidden flex-1 items-center justify-end pr-1 sm:flex">
            <span className="text-[11px] font-medium uppercase tracking-widest text-white/50">
              Do Hard Things
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function formatHuman(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  if (!m) return iso
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
