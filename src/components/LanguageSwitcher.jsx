import { Languages } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { translations } from '../i18n/translations'

const LANGS = ['en', 'fr', 'ar']

/** Segmented language picker: English / Français / العربية. */
export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-ink/20 p-1 dark:border-white/20"
      role="group"
      aria-label="Language"
    >
      <Languages size={13} className="ms-2 text-ink-mute dark:text-paper/60" aria-hidden="true" />
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          lang={code}
          className={`min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors ${
            lang === code
              ? 'bg-navy-900 text-paper dark:bg-lime dark:text-navy-900'
              : 'text-ink-soft hover:bg-navy-900/5 dark:text-paper/70 dark:hover:bg-white/10'
          }`}
        >
          {translations[code].langName}
        </button>
      ))}
    </div>
  )
}
