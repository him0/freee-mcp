---
"@him0/freee-mcp": patch
---

Centralize configuration directory path with XDG Base Directory support

- Add `getConfigDir()` utility function to `src/constants.ts`
- Support `XDG_CONFIG_HOME` environment variable
- Remove duplicated path construction from `src/auth/tokens.ts` and `src/config/companies.ts`
