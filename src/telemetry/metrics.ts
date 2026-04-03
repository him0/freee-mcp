import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram } from '@opentelemetry/api';

const METER_NAME = 'freee-mcp';

// HTTP server metrics
let _httpRequestDuration: Histogram | null = null;
let _httpRequestErrorCount: Counter | null = null;

// MCP tool metrics
let _toolInvocationDuration: Histogram | null = null;
let _toolErrorCount: Counter | null = null;

/**
 * HTTP request duration histogram (seconds).
 * Labels: method, path, status
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
