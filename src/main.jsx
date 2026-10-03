import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { migrateLegacyProgram } from './lib/programs'
import './index.css'

// Before the first render: learners from the Data-Analytics-only era keep
// their tracker exactly as it was (pinned to DA); new learners see the
// program picker. Runs once — idempotent after that.
try {
  migrateLegacyProgram(window.localStorage)
} catch {
  /* storage blocked — the picker simply shows */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)

// PWA: offline support + installability. Production only, so dev never
// serves stale bundles from the service-worker cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* SW is an enhancement — the app works fully without it */
    })
  })
}
