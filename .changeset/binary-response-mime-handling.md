---
"freee-mcp": minor
---

バイナリレスポンスをMIMEタイプに応じて適切なMCPコンテンツタイプで返却するように改善。画像(JPEG/PNG/GIF/WebP)はImageContent、PDFはEmbeddedResource、CSVはテキスト、その他はエラーメッセージを返却。
