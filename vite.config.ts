import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [preact(), viteSingleFile()],
  test: {
    environment: 'node',
  },
})
