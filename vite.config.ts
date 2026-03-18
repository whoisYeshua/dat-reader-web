/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
  base: '/dat-reader-web/',
  server: { port: 5173 },
  build: {
    modulePreload: { polyfill: false },
  },
  worker: {
    format: 'es',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'protobuf',
              test: /node_modules[\\/]protobufjs/,
            },
          ],
        },
      },
    },
  },
})
