import { build } from 'esbuild';
import { dependencies } from './package.json';
import { chmod, mkdir, copyFile, readdir } from 'fs/promises';
import { join } from 'path';

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

// Copy minimal schema files to dist for npm package
const minimalSrcDir = './openapi/minimal';
const minimalDestDir = './dist/openapi/minimal';
await mkdir(minimalDestDir, { recursive: true });

const minimalFiles = await readdir(minimalSrcDir);
for (const file of minimalFiles) {
  if (file.endsWith('.json')) {
    await copyFile(join(minimalSrcDir, file), join(minimalDestDir, file));
  }
}
console.log(`Copied ${minimalFiles.filter(f => f.endsWith('.json')).length} minimal schema files to dist/`);

