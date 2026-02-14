#!/usr/bin/env tsx

/**
 * Fetch OpenAPI schemas from freee API official repositories
 * Downloads JSON/YAML schemas and saves them as JSON in the openapi directory
 * Also generates minimized schemas for reduced memory consumption
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
const MINIMAL_DIR = join(OPENAPI_DIR, "minimal");

// Types for minimal schema
interface MinimalParameter {
  name: string;
  in: "path" | "query";
  required?: boolean;
  description?: string;
  type: string;
}

interface MinimalOperation {
  summary?: string;
  description?: string;
  parameters?: MinimalParameter[];
  hasJsonBody?: boolean;
}

interface MinimalPathItem {
  get?: MinimalOperation;
  post?: MinimalOperation;
  put?: MinimalOperation;
  delete?: MinimalOperation;
  patch?: MinimalOperation;
}

interface MinimalSchema {
  paths: Record<string, MinimalPathItem>;
}

// Types for OpenAPI schema (subset needed for minimization)
interface OpenAPIParameter {
  name: string;
  in: string;
  schema?: { type: string };
  type?: string;
  required?: boolean;
  description?: string;
}

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    content?: {
      "application/json"?: unknown;
    };
  };
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  patch?: OpenAPIOperation;
}

interface OpenAPISchema {
  paths: Record<string, OpenAPIPathItem>;
}

/**
 * Minimize an OpenAPI schema to only include fields that are actually used
 */
function minimizeSchema(schema: OpenAPISchema): MinimalSchema {
  const minimalPaths: Record<string, MinimalPathItem> = {};
  const methods = ["get", "post", "put", "delete", "patch"] as const;

  for (const [path, pathItem] of Object.entries(schema.paths)) {
    const minimalPathItem: MinimalPathItem = {};

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const minimalOperation: MinimalOperation = {};

      if (operation.summary) {
        minimalOperation.summary = operation.summary;
      }
      if (operation.description) {
        minimalOperation.description = operation.description;
      }

      if (operation.parameters && operation.parameters.length > 0) {
        minimalOperation.parameters = operation.parameters
          .filter((p) => p.in === "path" || p.in === "query")
          .map((p) => {
            const param: MinimalParameter = {
              name: p.name,
              in: p.in as "path" | "query",
              type: p.schema?.type || p.type || "string",
            };
            if (p.required !== undefined) {
              param.required = p.required;
            }
            if (p.description) {
              param.description = p.description;
            }
            return param;
          });

        if (minimalOperation.parameters.length === 0) {
          delete minimalOperation.parameters;
        }
      }

      if (operation.requestBody?.content?.["application/json"]) {
        minimalOperation.hasJsonBody = true;
      }

      minimalPathItem[method] = minimalOperation;
    }

    if (Object.keys(minimalPathItem).length > 0) {
      minimalPaths[path] = minimalPathItem;
    }
  }

  return { paths: minimalPaths };
}

// Schema sources
const SCHEMA_SOURCES = [
  {
    name: "accounting-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/v2020_06_15/open-api-3/api-schema.json",
    outputFile: "accounting-api-schema.json",
    minimalFile: "accounting.json",
  },
  {
    name: "hr-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/hr/open-api-3/api-schema.json",
    outputFile: "hr-api-schema.json",
    minimalFile: "hr.json",
  },
  {
    name: "invoice-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/iv/open-api-3/api-schema.yml",
    outputFile: "invoice-api-schema.json",
    minimalFile: "invoice.json",
  },
  {
    name: "pm-api",
    url: "https://pm.secure.freee.co.jp/api_docs/swagger.yml",
    outputFile: "pm-api-schema.json",
    minimalFile: "pm.json",
  },
  {
    name: "sm-api",
    url: "https://raw.githubusercontent.com/freee/freee-api-schema/master/sm/open-api-3/api-schema.yml",
    outputFile: "sm-api-schema.json",
    minimalFile: "sm.json",
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
 * Fetch a single schema and generate minimized version
 */
async function fetchSchema(source: {
  name: string;
  url: string;
  outputFile: string;
  minimalFile: string;
}): Promise<void> {
  console.log(`Fetching ${source.name} from ${source.url}...`);

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${source.name}: ${response.status} ${response.statusText}`
    );
  }

  const content = await response.text();

  let jsonContent: OpenAPISchema;
  if (isYaml(content)) {
    console.log(`  Converting YAML to JSON...`);
    jsonContent = parseYaml(content) as OpenAPISchema;
  } else {
    jsonContent = JSON.parse(content) as OpenAPISchema;
  }

  // Save full schema
  const outputPath = join(OPENAPI_DIR, source.outputFile);
  await writeFile(outputPath, JSON.stringify(jsonContent, null, 2), "utf-8");
  console.log(`  Saved to ${source.outputFile}`);

  // Generate and save minimized schema
  const minimalSchema = minimizeSchema(jsonContent);
  const minimalPath = join(MINIMAL_DIR, source.minimalFile);
  await writeFile(minimalPath, JSON.stringify(minimalSchema, null, 2), "utf-8");

  // Calculate size reduction
  const fullSize = JSON.stringify(jsonContent).length;
  const minimalSize = JSON.stringify(minimalSchema).length;
  const reduction = ((1 - minimalSize / fullSize) * 100).toFixed(1);
  console.log(
    `  Minimized to ${source.minimalFile} (${reduction}% reduction: ${(fullSize / 1024).toFixed(0)}KB -> ${(minimalSize / 1024).toFixed(0)}KB)`
  );
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("Fetching OpenAPI schemas from freee API...");
  console.log("==========================================");
  console.log("");

  // Ensure output directories exist
  await mkdir(OPENAPI_DIR, { recursive: true });
  await mkdir(MINIMAL_DIR, { recursive: true });

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
