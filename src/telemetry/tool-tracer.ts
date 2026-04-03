import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Attributes } from '@opentelemetry/api';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

/**
 * Drop-in replacement for server.registerTool() that wraps the handler
 * with an OTel span named `mcp.tool {toolName}`.
 *
 * When OTel is not initialized, the no-op tracer passes through transparently
 * (same pattern as withRedis in server/errors.ts).
 */
// biome-ignore lint/suspicious/noExplicitAny: registerTool has complex generic overloads that cannot be cleanly wrapped
export function registerTracedTool(server: McpServer, name: string, config: any, handler: (...args: any[]) => any): void {
  // biome-ignore lint/suspicious/noExplicitAny: wrapping preserves original handler's arg types
  const tracedHandler = async (...handlerArgs: any[]) => {
    const tracer = trace.getTracer('freee-mcp');
    return tracer.startActiveSpan(
      `mcp.tool ${name}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: { 'mcp.tool.name': name },
      },
      async (span) => {
        try {
          const result = await handler(...handlerArgs);
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
          span.end();
          throw error;
        }
      },
    );
  };
  // biome-ignore lint/suspicious/noExplicitAny: type assertion needed for McpServer overload compatibility
  server.registerTool(name, config, tracedHandler as any);
}

/**
 * Set attributes on the currently active OTel span.
 * Used by tool handlers to add context-specific attributes (e.g., service, path, method)
 * after the span has been created by registerTracedTool.
 *
 * No-ops when no active span exists (e.g., OTel disabled or called outside span context).
 */
export function setToolAttributes(attrs: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attrs);
  }
}
