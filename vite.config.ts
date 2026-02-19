import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  // Detect GitHub Actions build (GitHub Pages)
  const isGithub = process.env.GITHUB_ACTIONS === 'true'

  return {
    // ✅ Automatically choose correct base path
    base: isGithub ? '/ltl-test-monitor/' : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
