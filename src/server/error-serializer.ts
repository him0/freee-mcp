import { serializeError } from 'serialize-error';

/**
 * A single entry in a flattened `Error.cause` chain, safe to log.
 *
 * Every string field is scrubbed of sensitive identifiers (numeric IDs,
 * email addresses) before reaching the log stream.
 */
export interface ErrorChainEntry {
  name: string;
  message: string;
  stack?: string;
  code?: string;
}

/** Safety cap on how deep the cause chain is traversed. */
const DEFAULT_MAX_CHAIN_DEPTH = 10;

/** Match standalone numeric identifiers (6+ digits): company_id, user_id, timestamps. */
const NUMERIC_ID_PATTERN = /\b\d{6,}\b/g;

/**
 * Email-like token matcher for log redaction (not full RFC validation).
 * Uses boundaries to reduce matching inside larger tokens while still
 * preferring over-masking over under-masking.
 */
const EMAIL_PATTERN =
  /(^|[^A-Za-z0-9._%+-])([A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,63})(?=$|[^A-Za-z0-9._%+-])/g;

/**
 * Mask sensitive identifiers from a free-form error message.
 *
 * Masks:
 * - Numeric IDs with 6 or more digits (company_id, user_id, millisecond
 *   timestamps). Line numbers and small integers like HTTP status codes
 *   are intentionally left alone so stack traces stay readable.
 * - Email addresses.
 */
export function scrubErrorMessage(input: unknown): string {
  if (typeof input !== 'string') return scrubErrorMessage(String(input ?? ''));
  if (input.length === 0) return input;
  return input
    .replace(EMAIL_PATTERN, '$1[REDACTED_EMAIL]')
    .replace(NUMERIC_ID_PATTERN, '[REDACTED_ID]');
}

/**
 * Build a single-entry error chain for synthetic errors (validation failures,
 * routing 404s) that don't have an actual thrown Error object. Routes through
 * `serializeErrorChain` so the result gets the same scrub + shape as a real
 * thrown error, and a stack rooted at the caller (this helper frame elided).
 */
export function makeErrorChain(name: string, message: string): ErrorChainEntry[] {
  const err = new Error(message);
  err.name = name;
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(err, makeErrorChain);
  }
  return serializeErrorChain(err, 1);
}

/**
 * Walk the `Error.cause` chain of a thrown value and return a flattened
 * array of entries, each containing the bare minimum needed for log-based
 * debugging (name, message, stack, code).
 *
 * Non-Error throws (e.g., `throw 'oops'`) are normalized via serialize-error
 * into an Error-shaped object. Circular references and excessive depth are
 * bounded by `maxDepth` and a WeakSet of visited objects.
 */
export function serializeErrorChain(
  err: unknown,
  maxDepth: number = DEFAULT_MAX_CHAIN_DEPTH,
): ErrorChainEntry[] {
  const chain: ErrorChainEntry[] = [];
  const seen = new WeakSet<object>();
  let current: unknown = err;
  let depth = 0;

  while (current !== undefined && current !== null && depth < maxDepth) {
    if (typeof current === 'object') {
      if (seen.has(current)) break;
      seen.add(current);
    }

    // serialize-error safely handles non-Error values, toJSON methods,
    // circular references, and Buffer-valued properties. maxDepth: 1 keeps
    // top-level primitives (name, message, stack) but collapses any nested
    // objects to `{}`, which is exactly what we want for a flat chain entry.
    const serialized = serializeError(current, { maxDepth: 1 });

    const rawMessage = typeof serialized.message === 'string' ? serialized.message : '';
    const rawStack = typeof serialized.stack === 'string' ? serialized.stack : undefined;

    chain.push({
      name: typeof serialized.name === 'string' ? serialized.name : 'Error',
      message: scrubErrorMessage(rawMessage),
      stack: rawStack !== undefined ? scrubErrorMessage(rawStack) : undefined,
      code: typeof serialized.code === 'string' ? serialized.code : undefined,
    });

    depth += 1;
    current = typeof current === 'object' ? (current as { cause?: unknown }).cause : undefined;
  }

  return chain;
}
