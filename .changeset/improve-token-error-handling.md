---
"@him0/freee-mcp": patch
---

fix: improve token error handling with Result type pattern

- Replace safeParseJson with parseJsonResponse that returns a Result type, preserving error context instead of silently returning empty object
- Propagate token refresh errors in getValidAccessToken instead of returning null, allowing callers to understand failure reasons
- Add comprehensive tests for parseJsonResponse and token refresh failure scenarios
