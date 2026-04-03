---
"freee-mcp": minor
---

OAuth認証完了時にデフォルト事業所を自動設定するようにした。初回認証後にcurrent companyが未設定(ID: 0)の場合、会計API（またはHR API）から事業所一覧を取得し、最初の事業所を自動で設定する。
