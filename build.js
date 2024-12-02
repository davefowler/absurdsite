import * as esbuild from 'esbuild'
import { readFile, writeFile, cp } from 'fs/promises'

// Common config
const commonConfig = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  loader: {
    '.sql': 'text',
  },
  bundle: true,
  external: [
    'better-sqlite3',
    'commander',
    'events',
    'path',
    'fs',
    'os',
    'stream',
    'gray-matter',
    'nunjucks',
    'body-parser',
    'express',
    'html-escaper',
    'marked',
    'supertest',
  ],
}

// Build the main CLI code
await esbuild.build({
  ...commonConfig,
  entryPoints: ['src/cli/cli.ts'],
  outfile: 'dist/cli/cli.js',
})

// Copy starter templates
await cp('src/starter', 'dist/starter', { recursive: true }) 