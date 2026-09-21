import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Polling nécessaire pour détecter les changements de fichiers montés en volume
    // (Docker Desktop / bind mounts sur certains OS ne propagent pas les évènements inotify)
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text"],
      reportsDirectory: "./coverage",
    },
  },
})