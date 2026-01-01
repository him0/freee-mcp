---
"@him0/freee-mcp": minor
---

refactor: rename freee_set_company to freee_set_current_company

- Rename freee_set_company tool to freee_set_current_company for consistency with freee_get_current_company
- Remove FREEE_DEFAULT_COMPANY_ID environment variable (use freee_set_current_company tool instead)
