import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram } from '@opentelemetry/api';

const METER_NAME = 'freee-mcp';

// HTTP server metrics
let _httpRequestDuration: Histogram | null = null;
let _httpRequestErrorCount: Counter | null = null;
let _mcpSseConnectionDuration: Histogram | null = null;

// MCP tool metrics
let _toolInvocationDuration: Histogram | null = null;
let _toolErrorCount: Counter | null = null;

/**
 * HTTP request duration histogram (seconds).
 * Labels: method, path, status, transport, close_reason
 */
export function getHttpRequestDuration(): Histogram {
  if (!_httpRequestDuration) {
    _httpRequestDuration = metrics.getMeter(METER_NAME).createHistogram('http.server.request.duration', {
      description: 'HTTP server request duration',
      unit: 's',
    });
  }
  return _httpRequestDuration;
}

/**
 * SSE (Streamable-HTTP) connection lifetime histogram (seconds).
 *
 * Recorded only for `transport=sse` requests at connection close. The expected
 * distribution clusters near the route's `streamIdleTimeout` (e.g. ~600s on
 * Istio's default HTTPRoute), so the p99 reveals whether SSE clients are
 * disconnecting early or running until the platform max — useful when
 * triaging `envoy.cluster.upstream_rq_timeout` alerts which alone cannot
 * distinguish "long but normal SSE" from "slow JSON-RPC".
 *
 * Labels: path, status, close_reason
 */
export function getMcpSseConnectionDuration(): Histogram {
  if (!_mcpSseConnectionDuration) {
    _mcpSseConnectionDuration = metrics.getMeter(METER_NAME).createHistogram('mcp.sse.connection.duration', {
      description: 'SSE (Streamable-HTTP) connection lifetime',
      unit: 's',
    });
  }
  return _mcpSseConnectionDuration;
}

/**
 * HTTP server error counter (5xx responses).
 * Labels: method, path, status
 */
export function getHttpRequestErrorCount(): Counter {
  if (!_httpRequestErrorCount) {
    _httpRequestErrorCount = metrics.getMeter(METER_NAME).createCounter('http.server.error.count', {
      description: 'HTTP server error count (5xx)',
    });
  }
  return _httpRequestErrorCount;
}

/**
 * MCP tool invocation duration histogram (seconds).
 * Labels: tool_name
 */
export function getToolInvocationDuration(): Histogram {
  if (!_toolInvocationDuration) {
    _toolInvocationDuration = metrics.getMeter(METER_NAME).createHistogram('mcp.tool.invocation.duration', {
      description: 'MCP tool invocation duration',
      unit: 's',
    });
  }
  return _toolInvocationDuration;
}

/**
 * MCP tool error counter.
 * Labels: tool_name
 */
export function getToolErrorCount(): Counter {
  if (!_toolErrorCount) {
    _toolErrorCount = metrics.getMeter(METER_NAME).createCounter('mcp.tool.error.count', {
      description: 'MCP tool error count',
    });
  }
  return _toolErrorCount;
}
