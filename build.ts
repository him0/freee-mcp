import { dependencies, version } from './package.json';
import { chmod, copyFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const buildConfig = {
  external: Object.keys(dependencies),
  minify: true,
  target: 'node' as const,
  format: 'esm' as const,
  outdir: '.',
  define: {
    __PACKAGE_VERSION__: JSON.stringify(version),
  },
  banner: '#! /usr/bin/env node\n',
};

const binFiles = [
  { entry: 'src/index.ts', out: './bin/freee-mcp.js' },
  { entry: 'src/freee-cli/index.ts', out: './bin/freee-cli.js' },
];

for (const { entry, out } of binFiles) {
  const result = await Bun.build({
    ...buildConfig,
    entrypoints: [entry],
    naming: { entry: out },
  });

  if (!result.success) {
    console.error(`Build failed for ${entry}:`);
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  await chmod(out, 0o755);
  console.log(`Built ${out}`);
}

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
