---
'freee-mcp': patch
---

freee_api_* の全 API リクエストにヘッダー `freee-using-beta: true` を常時付与するようにしました。

- 今後提供予定の OpenBeta 区分 API はこのヘッダーがないと呼び出せない仕様になります
- OpenBeta API はスキーマに破壊的変更が告知なく入る可能性がありますが、MCP 経由の利用は呼び出し時にスキーマを参照するため影響を受けにくく、無条件で有効化します
- 対象: `makeApiRequest` 経由の全リクエスト（stdio / remote 両モードから共通利用される）
