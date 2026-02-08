import { defineConfig } from 'vite'

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
})
