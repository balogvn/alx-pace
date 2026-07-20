import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The curriculum CSV is imported at build time via the `?raw` suffix
// (see src/lib/schedule.js), so it is bundled deterministically with the
// app — no runtime fetch, works fully offline, and learners never see a
// file-upload input.
export default defineConfig({
  // BASE_PATH is set by the GitHub Pages deploy workflow (/alx-pace/);
  // local dev and generic hosts serve from the root.
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
