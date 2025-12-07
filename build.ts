import { build } from 'esbuild';
import { dependencies } from './package.json';
import { chmod } from 'fs/promises';

const entryFile = 'src/index.ts';
const shared = {
  bundle: true,
  entryPoints: [entryFile],
  external: Object.keys(dependencies),
  logLevel: 'info' as 'info',
  minify: true,
  sourcemap: false,
  platform: 'node' as 'node',
};

await build({
  ...shared,
  format: 'esm',
  outfile: './dist/index.esm.js',
  target: ['ES2022'],
});

await build({
  ...shared,
  format: 'cjs',
  outfile: './dist/index.cjs',
  target: ['ES2022'],
});

const binFile = './bin/cli.js';
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
