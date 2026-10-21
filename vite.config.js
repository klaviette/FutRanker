import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    // Multi-page: home hub at /, one folder per module
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        goat: resolve(import.meta.dirname, 'goat/index.html'),
        seriesOdds: resolve(import.meta.dirname, 'series-odds/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
  },
})
