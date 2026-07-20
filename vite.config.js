import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The curriculum CSV is imported at build time via the `?raw` suffix
// (see src/lib/schedule.js), so it is bundled deterministically with the
// app — no runtime fetch, works fully offline, and learners never see a
// file-upload input.
export default defineConfig({
  plugins: [react()],
})
