#!/usr/bin/env tsx

/**
 * Generate reference documentation from OpenAPI schemas
 * This script uses tag-mappings.json to determine English filenames
 */

import { join, dirname } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = join(SCRIPT_DIR, "..");
const OPENAPI_DIR = join(PROJECT_ROOT, "openapi");
const OUTPUT_DIR = join(PROJECT_ROOT, "skills", "freee-api-skill", "references");
const MAPPINGS_FILE = join(OPENAPI_DIR, "tag-mappings.json");

// Type definitions
interface Parameter {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
}

interface RequestBody {
  content?: {
    [mediaType: string]: {
      schema?: SchemaObject;
    };
  };
  required?: boolean;
}

interface Response {
  description?: string;
  content?: {
    [mediaType: string]: {
      schema?: SchemaObject;
    };
  };
}

interface SchemaObject {
  $ref?: string;
  type?: string;
  format?: string;
  description?: string;
  example?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  required?: string[];
  properties?: {
    [key: string]: SchemaObject;
  };
  items?: SchemaObject;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
}

interface Operation {
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: {
    [statusCode: string]: Response;
  };
}

interface PathData {
  path: string;
  operations: Operation[];
}

interface TagMappings {
  [apiName: string]: {
    [tagName: string]: string;
  };
}

interface OpenAPISchema {
  tags?: Array<{ name: string; description?: string }>;
  paths: {
    [path: string]: {
      [method: string]: {
        tags?: string[];
        operationId?: string;
        summary?: string;
        description?: string;
        parameters?: Parameter[];
        requestBody?: RequestBody;
        responses?: {
          [statusCode: string]: Response;
        };
      };
    };
  };
  components?: {
    schemas?: {
      [key: string]: SchemaObject;
    };
  };
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Resolve $ref in schema
 */
function resolveRef(
  schema: OpenAPISchema,
  ref: string
): SchemaObject | undefined {
  // $ref format: "#/components/schemas/SchemaName"
  const parts = ref.split("/");
  if (parts[0] !== "#" || parts[1] !== "components" || parts[2] !== "schemas") {
    return undefined;
  }

  const schemaName = parts[3];
  return schema.components?.schemas?.[schemaName];
}

/**
 * Get type description from schema
 */
function getTypeDescription(schema: SchemaObject): string {
  if (schema.type === "array" && schema.items) {
    const itemType = schema.items.type || "object";
    return `array[${itemType}]`;
  }
  if (schema.format) {
    return `${schema.type}(${schema.format})`;
  }
  return schema.type || "object";
}

/**
 * Format schema properties as markdown
 */
function formatSchemaProperties(
  apiSchema: OpenAPISchema,
  schema: SchemaObject,
  indent: string = "",
  maxDepth: number = 2,
  currentDepth: number = 0
): string {
  if (currentDepth >= maxDepth) {
    return "";
  }

  let result = "";
  const properties = schema.properties || {};
  const required = schema.required || [];

  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(propName);
    const requiredMark = isRequired ? " (必須)" : " (任意)";

    // Resolve $ref if present
    let resolvedSchema = propSchema;
    if (propSchema.$ref) {
      const resolved = resolveRef(apiSchema, propSchema.$ref);
      if (resolved) {
        resolvedSchema = resolved;
      }
    }

    const typeDesc = getTypeDescription(resolvedSchema);
    result += `${indent}- ${propName}${requiredMark}: ${typeDesc}`;

    if (resolvedSchema.description) {
      result += ` - ${resolvedSchema.description}`;
    }

    // Add enum values
    if (resolvedSchema.enum) {
      result += ` (選択肢: ${resolvedSchema.enum.join(", ")})`;
    }

    // Add example
    if (resolvedSchema.example !== undefined) {
      const exampleStr =
        typeof resolvedSchema.example === "string"
          ? resolvedSchema.example
          : JSON.stringify(resolvedSchema.example);
      result += ` 例: \`${exampleStr}\``;
    }

    // Add constraints
    const constraints: string[] = [];
    if (resolvedSchema.minimum !== undefined) {
      constraints.push(`最小: ${resolvedSchema.minimum}`);
    }
    if (resolvedSchema.maximum !== undefined) {
      constraints.push(`最大: ${resolvedSchema.maximum}`);
    }
    if (resolvedSchema.pattern) {
      constraints.push(`パターン: ${resolvedSchema.pattern}`);
    }
    if (constraints.length > 0) {
      result += ` (${constraints.join(", ")})`;
    }

    result += "\n";

    // Recursively format nested properties
    if (resolvedSchema.properties && currentDepth < maxDepth - 1) {
      result += formatSchemaProperties(
        apiSchema,
        resolvedSchema,
        indent + "  ",
        maxDepth,
        currentDepth + 1
      );
    }

    // Handle array items
    if (
      resolvedSchema.type === "array" &&
      resolvedSchema.items &&
      currentDepth < maxDepth - 1
    ) {
      let itemSchema = resolvedSchema.items;
      if (itemSchema.$ref) {
        const resolved = resolveRef(apiSchema, itemSchema.$ref);
        if (resolved) {
          itemSchema = resolved;
        }
      }
      if (itemSchema.properties) {
        result += `${indent}  配列の要素:\n`;
        result += formatSchemaProperties(
          apiSchema,
          itemSchema,
          indent + "    ",
          maxDepth,
          currentDepth + 1
        );
      }
    }
  }

  return result;
}

/**
 * Format parameters as markdown
 */
function formatParameters(parameters: Parameter[]): string {
  if (!parameters || parameters.length === 0) {
    return "";
  }

  let result = "### パラメータ\n\n";
  result += "| 名前 | 位置 | 必須 | 型 | 説明 |\n";
  result += "|------|------|------|-----|------|\n";

  for (const param of parameters) {
    const name = param.name || "";
    const location = param.in || "";
    const required = param.required ? "はい" : "いいえ";
    const type = param.schema ? getTypeDescription(param.schema) : "";
    const description = param.schema?.description || param.description || "";

    // Add enum values to description
    let descWithEnum = description;
    if (param.schema?.enum) {
      descWithEnum += ` (選択肢: ${param.schema.enum.join(", ")})`;
    }

    result += `| ${name} | ${location} | ${required} | ${type} | ${descWithEnum} |\n`;
  }

  result += "\n";
  return result;
}

/**
 * Format request body as markdown
 */
function formatRequestBody(
  apiSchema: OpenAPISchema,
  requestBody: RequestBody
): string {
  if (!requestBody || !requestBody.content) {
    return "";
  }

  let result = "### リクエストボディ\n\n";

  // Get JSON schema (prefer application/json)
  const jsonContent =
    requestBody.content["application/json"] ||
    requestBody.content["application/x-www-form-urlencoded"];

  if (!jsonContent || !jsonContent.schema) {
    return "";
  }

  let schema = jsonContent.schema;

  // Resolve $ref if present
  if (schema.$ref) {
    const resolved = resolveRef(apiSchema, schema.$ref);
    if (resolved) {
      schema = resolved;
    }
  }

  if (requestBody.required) {
    result += "(必須)\n\n";
  }

  result += formatSchemaProperties(apiSchema, schema);
  result += "\n";

  return result;
}

/**
 * Format success response as markdown
 */
function formatSuccessResponse(
  apiSchema: OpenAPISchema,
  responses: { [statusCode: string]: Response }
): string {
  if (!responses) {
    return "";
  }

  // Find success response (200, 201, 204)
  const successCodes = ["200", "201", "204"];
  let successResponse: Response | undefined;
  let statusCode: string | undefined;

  for (const code of successCodes) {
    if (responses[code]) {
      successResponse = responses[code];
      statusCode = code;
      break;
    }
  }

  if (!successResponse) {
    return "";
  }

  let result = `### レスポンス (${statusCode})\n\n`;

  if (successResponse.description) {
    result += `${successResponse.description}\n\n`;
  }

  // Get JSON schema
  const jsonContent = successResponse.content?.["application/json"];
  if (!jsonContent || !jsonContent.schema) {
    return result;
  }

  let schema = jsonContent.schema;

  // Resolve $ref if present
  if (schema.$ref) {
    const resolved = resolveRef(apiSchema, schema.$ref);
    if (resolved) {
      schema = resolved;
    }
  }

  result += formatSchemaProperties(apiSchema, schema);
  result += "\n";

  return result;
}

/**
 * Extract endpoints by tag from OpenAPI schema
 */
function extractEndpointsByTag(
  schema: OpenAPISchema,
  tagName: string
): PathData[] {
  const results: PathData[] = [];

  for (const [path, pathItem] of Object.entries(schema.paths)) {
    const operations: Operation[] = [];

    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === "parameters") continue;
      if (!operation.tags?.includes(tagName)) continue;

      operations.push({
        method: method.toUpperCase(),
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        parameters: operation.parameters,
        requestBody: operation.requestBody,
        responses: operation.responses,
      });
    }

    if (operations.length > 0) {
      results.push({ path, operations });
    }
  }

  return results;
}

/**
 * Generate reference document for a single tag
 */
async function generateReference(
  apiName: string,
  schema: OpenAPISchema,
  tagName: string,
  englishName: string,
  prefix: string
): Promise<void> {
  const outputFile = join(OUTPUT_DIR, `${prefix}-${englishName}.md`);

  // Get tag description from schema
  const tag = schema.tags?.find((t) => t.name === tagName);
  const tagDesc = tag?.description ? stripHtmlTags(tag.description) : "";

  // Extract endpoints for this tag
  const endpoints = extractEndpointsByTag(schema, tagName);

  // Build endpoints markdown
  let endpointsMd = "";
  for (const { path, operations } of endpoints) {
    for (const operation of operations) {
      const { method, summary, description, parameters, requestBody, responses } =
        operation;

      endpointsMd += `### ${method} ${path}\n\n`;
      endpointsMd += `操作: ${summary || ""}\n\n`;

      if (description) {
        let cleanDesc = stripHtmlTags(description)
          .replace(/\s+/g, " ")
          .trim();

        if (cleanDesc.length > 500) {
          cleanDesc = cleanDesc.substring(0, 500) + "...";
        }

        if (cleanDesc) {
          endpointsMd += `説明: ${cleanDesc}\n\n`;
        }
      }

      // Add parameters
      if (parameters && parameters.length > 0) {
        endpointsMd += formatParameters(parameters);
      }

      // Add request body
      if (requestBody) {
        endpointsMd += formatRequestBody(schema, requestBody);
      }

      // Add response
      if (responses) {
        endpointsMd += formatSuccessResponse(schema, responses);
      }
    }
  }

  // Get schema basename
  const schemaBasename = `${apiName}-schema.json`;

  // Generate markdown document
  const markdown = `# ${tagName}

## 概要

${tagDesc}

## エンドポイント一覧

${endpointsMd}

## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [${schemaBasename}](../../openapi/${schemaBasename})
`;

  await writeFile(outputFile, markdown, "utf-8");
  console.log(`Generated: ${prefix}-${englishName}.md`);
}

/**
 * Process an API
 */
async function processApi(
  apiKey: string,
  schemaFile: string,
  prefix: string,
  mappings: TagMappings
): Promise<void> {
  console.log("");
  console.log(`Processing ${apiKey}...`);
  console.log("================================");

  // Read schema file
  const schemaText = await readFile(schemaFile, "utf-8");
  const schema: OpenAPISchema = JSON.parse(schemaText);

  // Get all tags from mappings
  const tagMappings = mappings[apiKey];
  if (!tagMappings) {
    console.log(`No mappings found for ${apiKey}`);
    return;
  }

  let count = 0;
  for (const [tagName, englishName] of Object.entries(tagMappings)) {
    if (englishName) {
      await generateReference(apiKey, schema, tagName, englishName, prefix);
      count++;
    }
  }

  console.log(`Generated ${count} files for ${apiKey}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    console.log("Starting reference document generation...");
    console.log("========================================");

    // Check if mappings file exists
    if (!existsSync(MAPPINGS_FILE)) {
      console.error(`Error: Tag mappings file not found: ${MAPPINGS_FILE}`);
      process.exit(1);
    }

    // Read mappings
    const mappingsText = await readFile(MAPPINGS_FILE, "utf-8");
    const mappings: TagMappings = JSON.parse(mappingsText);

    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Process each API
    await processApi(
      "accounting-api",
      join(OPENAPI_DIR, "accounting-api-schema.json"),
      "accounting",
      mappings
    );
    await processApi(
      "hr-api",
      join(OPENAPI_DIR, "hr-api-schema.json"),
      "hr",
      mappings
    );
    await processApi(
      "invoice-api",
      join(OPENAPI_DIR, "invoice-api-schema.json"),
      "invoice",
      mappings
    );
    await processApi(
      "pm-api",
      join(OPENAPI_DIR, "pm-api-schema.json"),
      "pm",
      mappings
    );

    console.log("");
    console.log("========================================");
    console.log("Reference generation complete!");
    console.log(`Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run main function
main();
