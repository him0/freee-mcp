import { build } from 'esbuild';
import { dependencies, version } from './package.json';
import { chmod, copyFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const binFile = './bin/cli.js';

// Build CLI binary (bundled)
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
  define: {
    __PACKAGE_VERSION__: JSON.stringify(version),
  },
});
await chmod(binFile, 0o755);

// Build core module (for programmatic use by external projects)
await build({
  bundle: true,
  entryPoints: ['src/core.ts'],
  external: Object.keys(dependencies),
  logLevel: 'info' as 'info',
  minify: false,
  sourcemap: true,
  platform: 'node' as 'node',
  format: 'esm',
  outfile: './dist/core.js',
  target: ['ES2022'],
  define: {
    __PACKAGE_VERSION__: JSON.stringify(version),
  },
});
console.log('Built core module: dist/core.js');

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

// Generate type declarations for core module
const { execSync } = await import('child_process');
execSync('tsc --emitDeclarationOnly --declaration --declarationDir ./dist --project tsconfig.json', {
  stdio: 'inherit',
});
console.log('Generated type declarations for core module');

