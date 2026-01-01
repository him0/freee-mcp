---
"@him0/freee-mcp": minor
---

Simplify company management by removing state-based company switching

- Remove `freee_set_company` and `freee_get_current_company` tools
- Remove `currentCompanyId` and `companies` from config (only keep `defaultCompanyId`)
- Add `company_id` parameter to all API tools (optional, defaults to `defaultCompanyId`)
- Update skill documentation with new company_id behavior
- Migrate legacy config format automatically
