---
"@him0/freee-mcp": patch
---

refactor: extract duplicate patterns into utility functions

- Add createTextResponse() for MCP text response wrapper pattern
- Add formatErrorMessage() for error message formatting
- Refactor tools.ts and client-mode.ts to use new utilities
