#!/usr/bin/env tsx

/**
 * Fetch OpenAPI schemas from freee API official repositories
 * Downloads JSON/YAML schemas and saves them as JSON in the openapi directory
 */

import { join, dirname } from "path";
import { writeFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const OPENAPI_DIR = join(PROJECT_ROOT, "openapi");

// Schema sources
const SCHEMA_SOURCES = [
  {
    name: "accounting-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/v2020_06_15/open-api-3/api-schema.json",
    outputFile: "accounting-api-schema.json",
  },
  {
    name: "hr-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/hr/open-api-3/api-schema.json",
    outputFile: "hr-api-schema.json",
  },
  {
    name: "invoice-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/iv/open-api-3/api-schema.yml",
    outputFile: "invoice-api-schema.json",
  },
  {
    name: "pm-api",
    url: "https://pm.secure.freee.co.jp/api_docs/swagger.yml",
    outputFile: "pm-api-schema.json",
  },
  {
    name: "sm-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/sm/open-api-3/api-schema.yml",
    outputFile: "sm-api-schema.json",
  },
];

/**
 * Check if content is YAML (not JSON)
 */
function isYaml(content: string): boolean {
  const trimmed = content.trim();
  // JSON starts with { or [
  return !trimmed.startsWith("{") && !trimmed.startsWith("[");
}

/**
 * Fetch a single schema
 */
async function fetchSchema(source: {
  name: string;
  url: string;
  outputFile: string;
}): Promise<void> {
  console.log(`Fetching ${source.name} from ${source.url}...`);

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${source.name}: ${response.status} ${response.statusText}`
    );
  }

  const content = await response.text();

  let jsonContent: unknown;
  if (isYaml(content)) {
    console.log(`  Converting YAML to JSON...`);
    jsonContent = parseYaml(content);
  } else {
    jsonContent = JSON.parse(content);
  }

  const outputPath = join(OPENAPI_DIR, source.outputFile);
  await writeFile(outputPath, JSON.stringify(jsonContent, null, 2), "utf-8");

  console.log(`  Saved to ${source.outputFile}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("Fetching OpenAPI schemas from freee API...");
  console.log("==========================================");
  console.log("");

  // Ensure output directory exists
  await mkdir(OPENAPI_DIR, { recursive: true });

  // Fetch all schemas
  const results: { name: string; success: boolean; error?: string }[] = [];

  for (const source of SCHEMA_SOURCES) {
    try {
      await fetchSchema(source);
      results.push({ name: source.name, success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`  Error: ${errorMessage}`);
      results.push({ name: source.name, success: false, error: errorMessage });
    }
    console.log("");
  }

  // Summary
  console.log("==========================================");
  console.log("Summary:");
  for (const result of results) {
    const status = result.success ? "✓" : "✗";
    console.log(`  ${status} ${result.name}`);
  }

  const failedCount = results.filter((r) => !r.success).length;
  if (failedCount > 0) {
    console.log("");
    console.log(`Warning: ${failedCount} schema(s) failed to fetch`);
    process.exit(1);
  }

  console.log("");
  console.log("All schemas fetched successfully!");
}

main();
