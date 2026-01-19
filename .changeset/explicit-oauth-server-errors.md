---
"@him0/freee-mcp": patch
---

fix: improve error handling for OAuth callback server startup failures

- Add explicit error messages when OAuth callback server fails to start
- Log when server is already running instead of silently returning
- Clean up server state properly on error
