import { dependencies, version } from './package.json';
import { chmod, copyFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const binFile = './bin/cli.js';
const result = await Bun.build({
  entrypoints: ['src/index.ts'],
  external: Object.keys(dependencies),
  minify: true,
  target: 'node',
  format: 'esm',
  outdir: '.',
  naming: { entry: binFile },
  define: {
    __PACKAGE_VERSION__: JSON.stringify(version),
  },
  banner: '#! /usr/bin/env node\n',
});

if (!result.success) {
  console.error('Build failed:');
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

await chmod(binFile, 0o755);
console.log(`Built ${binFile}`);

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
