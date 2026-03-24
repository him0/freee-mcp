import { dependencies, version } from './package.json';
import { chmod, copyFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const entries = [
  { entrypoint: 'src/index.ts', output: './bin/freee-mcp.js' },
  { entrypoint: 'src/entry-remote.ts', output: './bin/freee-remote-mcp.js' },
];

for (const { entrypoint, output } of entries) {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    external: Object.keys(dependencies),
    minify: true,
    target: 'node',
    format: 'esm',
    outdir: '.',
    naming: { entry: output },
    define: {
      __PACKAGE_VERSION__: JSON.stringify(version),
    },
    banner: '#! /usr/bin/env node\n',
  });

  if (!result.success) {
    console.error(`Build failed for ${entrypoint}:`);
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  await chmod(output, 0o755);
  console.log(`Built ${output}`);
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
