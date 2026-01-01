---
"@him0/freee-mcp": patch
---

perf: per-API lazy loading for OpenAPI schemas

- Load individual API schemas on demand instead of loading all 5 at once
- Remove unused getAllSchemas() function
- Memory usage reduced when using only 1-2 APIs (e.g., accounting only: 311KB instead of 482KB)
