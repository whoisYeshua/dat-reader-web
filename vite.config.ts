import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/dat-reader-web/',
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { protobuf: ['protobufjs'] },
      },
    },
  },
  worker: { format: 'es' },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
})
