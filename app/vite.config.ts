/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'text-summary', 'html', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/vite-env.d.ts'],
        all: true,
      },
    },
  };
})
