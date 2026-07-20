import { Award, ClipboardCheck, FlaskConical, GraduationCap } from 'lucide-react'

// Category colors mirror alxafrica.com's track tints (violet / green / amber /
// cobalt). Solid chips carry navy or white text at ≥4.5:1 in both themes.
const CONFIG = {
  exam: {
    label: 'Graded Exam',
    Icon: GraduationCap,
    className: 'bg-violet text-white',
  },
  'integrated-project': {
    label: 'Integrated Project',
    Icon: FlaskConical,
    className: 'bg-alxgreen text-navy-900',
  },
  'graded-test': {
    label: 'Graded Test',
    Icon: ClipboardCheck,
    className: 'bg-amber text-navy-900',
  },
  graded: {
    label: 'Graded',
    Icon: Award,
    className: 'bg-tint text-cobalt-600 ring-1 ring-inset ring-cobalt/30 dark:bg-white/10 dark:text-lime dark:ring-lime/30',
  },
}

/** Compact badge that classifies a graded milestone. */
export default function GradedBadge({ type, label, className = '' }) {
  const cfg = CONFIG[type] || CONFIG.graded
  const { Icon } = cfg
  return (
    <span className={`alx-chip ${cfg.className} ${className}`}>
      <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
      {label || cfg.label}
    </span>
  )
}
