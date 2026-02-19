import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'ltl-test-monitor'

export default defineConfig({
  plugins: [react()],

  // ✅ correct path for GitHub Pages
  base: process.env.GITHUB_ACTIONS
    ? `/${repoName}/`
    : '/',

  server: {
    port: 3000,
    host: true,
  },
})
