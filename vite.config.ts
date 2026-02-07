import { defineConfig } from 'vite'

export default defineConfig({
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
