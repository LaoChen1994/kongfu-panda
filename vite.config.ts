import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: './',
  build: { outDir: mode === 'poki' ? 'dist-poki' : 'dist' },
}))
