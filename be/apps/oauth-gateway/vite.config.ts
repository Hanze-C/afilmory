import { builtinModules } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'

const NODE_BUILT_INS = builtinModules.filter((m) => !m.startsWith('_'))
NODE_BUILT_INS.push(...NODE_BUILT_INS.map((m) => `node:${m}`))

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  ssr: {
    noExternal: true,
  },
  build: {
    ssr: true,
    rollupOptions: {
      external: NODE_BUILT_INS,
      input: {
        main: resolve(__dirname, 'src/index.ts'),
      },
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
})
