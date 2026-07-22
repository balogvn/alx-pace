import { defineConfig } from 'vitest/config'

// Vitest runs through Vite, so `?raw` CSV imports and JSX resolve the same way
// they do in the app build. Pure-logic tests need only the node environment.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
