import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: './',
  build: { outDir: mode === 'desktop' ? 'dist-desktop' : mode === 'poki' ? 'dist-poki' : 'dist' },
  server: { watch: { ignored: ['**/src-tauri/**', '**/artifacts/**'] } },
}))
