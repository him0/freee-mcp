import * as esbuild from "esbuild";
import { chmod } from "fs/promises";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/index.js",
  format: "esm",
  sourcemap: true,
  external: [],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

const binFile = "./bin/cli.js";
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: binFile,
  format: "esm",
  minify: true,
  sourcemap: false,
  external: [],
  banner: {
    js: "#!/usr/bin/env node\nimport { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});
await chmod(binFile, 0o755);

console.log("Build completed successfully");
