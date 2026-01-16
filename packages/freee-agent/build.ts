import { build } from 'esbuild';
import { dependencies } from './package.json';
import { chmod, mkdir } from 'fs/promises';

const binFile = './bin/cli.js';
await mkdir('./bin', { recursive: true });
await build({
  bundle: true,
  entryPoints: ['src/index.ts'],
  external: Object.keys(dependencies),
  logLevel: 'info' as 'info',
  minify: true,
  sourcemap: false,
  platform: 'node' as 'node',
  format: 'esm',
  outfile: binFile,
  target: ['ES2022'],
  banner: {
    js: '#! /usr/bin/env node\n',
  },
});
await chmod(binFile, 0o755);
