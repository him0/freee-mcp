# freee-mcp

## 0.25.0

### Minor Changes

- [`4aa21b1`](https://github.com/freee/freee-mcp/commit/4aa21b15f0041dd8bb00676a58e63fb2e5d3ab76): `freee_file_upload` ツールに `company_id` 必須引数を追加 ([#401](https://github.com/freee/freee-mcp/pull/401))

  通常の `freee_api_*` ツール (`src/api/client.ts` の `makeApiRequest`) と同様に、呼び出し側が渡した `company_id` とコンテキストで解決された事業所 ID を文字列比較で検証し、不一致時はエラーを返すようにした。誤った事業所へのファイルアップロードを防ぐガードレール。

  - MCP ツール `freee_file_upload` の inputSchema に `company_id` を必須で追加 (`string | number`)
  - `uploadReceipt()` の 2 番目の引数として `requestedCompanyId` を追加
  - 認証チェック直後にバリデーションを実施し、通常ツールと同一の文言でエラーを throw

- [`f7f0553`](https://github.com/freee/freee-mcp/commit/f7f05538664cf886ce9f5aa9ef6df338dca5eaee): Sign Remote MCP サーバーを追加 ([#395](https://github.com/freee/freee-mcp/pull/395))

  freee サイン用の Remote MCP サーバー（`freee-sign-remote-mcp`）を追加。freee 本体と同一構成で OAuth 2.1 Authorization Server + Streamable HTTP transport + Redis トークンストア + canonical log line + OTel tracing をサポート。

  - 新規エントリポイント `bin/freee-sign-remote-mcp.js`（ポート 3002）
  - ninja-sign.com との OAuth 2.0 code exchange + MCP クライアント向け OAuth 2.1 AS の二層認証
  - Docker Compose に `freee-sign-mcp` サービス追加、`Dockerfile.sign` でビルド分離

  ## 共有 Valkey での分離

  本番で Sign と freee 本体が共有する Valkey インスタンスの名前空間を以下で分離:

  - Redis の DB (freee 本体 DB 0 / Sign DB 1) とキー prefix (`freee-sign-mcp:*`) で名前空間分離
  - rate-limit キーに `rl:sign:*` prefix を付与し freee 本体とカウンタ合算を防止

  本番 Valkey は parameter group で `maxmemory-policy` 未設定のため Valkey デフォルト (`noeviction`) で稼働しており、cross-DB eviction は発生しない想定。

  ## ローカル開発環境の調整

  `compose.yaml` / `otel-collector-config.yaml` を本番挙動と整合させる:

  - Redis の `maxmemory-policy` を `noeviction` に変更し、本番 Valkey と同じ挙動でローカル検証できるようにする
  - OTel Collector に `memory_limiter` / `batch` processor を追加し、compose で Sign + freee が単一 collector を共有する開発環境の trace 欠落を防止（本番は Datadog Agent が Node 単位で OTLP を受ける構成のため該当しない）

  ## セキュリティ

  - `sign_api_*` ツールの path を `/v1/` 始まりに制限し、絶対 URL 経由で Bearer トークンが外部ホストへ流出する SSRF 経路を遮断
  - path traversal (`..` / `%2e%2e`) を Zod と URL 組み立て後の pathname 再検証で拒否し、ninja-sign.com 内の `/v1/` 外エンドポイントへの到達を防止
  - Remote モードで認証コンテキストが取れない場合に local filesystem のトークンへ fallback する経路を禁止し、impersonation を防止
  - ninja-sign.com との通信エラー本文を先頭 200 文字に truncate して PII 漏洩を防止
  - `/v1/users/me` レスポンスを Zod schema で検証し、id の型不正による Redis キー衝突を防止

### Patch Changes

- [`b7ffe3c`](https://github.com/freee/freee-mcp/commit/b7ffe3cf8bce5dd945b9a2e6c7dc59e00d4648fb): GitHub CLI の `gh skill` コマンド（v2.90.0 以降）経由でのスキルインストールをサポート。`skills/freee-api-skill/SKILL.md` のフロントマターに `license` と `metadata` を追加し、README に `gh skill install freee/freee-mcp freee-api-skill` のインストール手順を記載。 ([#397](https://github.com/freee/freee-mcp/pull/397))
- [`25acba0`](https://github.com/freee/freee-mcp/commit/25acba0adae6d6c612ab6f1609e079ed06c28877): Microsoft の [Agent Package Manager (APM)](https://github.com/microsoft/apm) による配布に対応。`skills/freee-api-skill/` に `apm.yml` を追加し、`apm install freee/freee-mcp/skills/freee-api-skill` コマンドでスキルをインストール可能にした。APM は対象プロジェクトに存在する `.github/`、`.claude/`、`.cursor/`、`.opencode/`、`.codex/` の各ディレクトリへスキルを自動デプロイする。 ([#396](https://github.com/freee/freee-mcp/pull/396))
- [`20a6ec9`](https://github.com/freee/freee-mcp/commit/20a6ec9f555b1b86d64550c5084b2bbc3ea17673): Sign Remote MCP の Redis 既定 DB 番号指定を撤廃 ([#403](https://github.com/freee/freee-mcp/pull/403))

  freee-mcp 本体と Sign Remote MCP で共有する Valkey (ElastiCache) の分離方式を「DB 番号による論理分離」から「`freee-sign-mcp:*` prefix + Valkey RBAC (IAM Role ACL)」に変更した。DB 分離は将来の cluster mode 移行を阻害するため採用しない。

  本 PR は当該方針に合わせて、アプリ側のデフォルト値から DB 番号を外す対応:

  - `compose.yaml`: `SIGN_REDIS_URL: redis://redis:6379/1` → `redis://redis:6379`
  - `src/sign/config.ts`: `SIGN_REDIS_URL` 未設定時の既定値を `redis://localhost:6379/1` → `redis://localhost:6379`
  - `src/sign/config.test.ts`: 既定値 assertion を追従

- [`ca1a324`](https://github.com/freee/freee-mcp/commit/ca1a3246b27c3d2bcdc6692bbf6a75ec4aef874a): リリース時に `skills/freee-api-skill/apm.yml` の `version` フィールドを `package.json` に自動追従させるよう publish ワークフローを拡張。既存の `.claude-plugin/plugin.json` / `marketplace.json` の同期ステップと同じコミットでまとめて push される。 ([#402](https://github.com/freee/freee-mcp/pull/402))

## 0.24.0

### Minor Changes

- [`186ffec`](https://github.com/freee/freee-mcp/commit/186ffecf7b0a740d9d2fbf46f9e6088d57a31dff): Remote モードの canonical log line を Datadog の status マッピングと整合するよう改善。 ([#390](https://github.com/freee/freee-mcp/pull/390))

  - HTTP status に応じて pino の log level を `info` / `warn` / `error` に分岐 (5xx → error, 4xx → warn, それ以外 → info)。401/403/404/422 もすべて warn に集約。
  - `formatters.level` で level を文字列ラベル (`"info"` / `"warn"` / `"error"`) として出力するよう変更。Datadog の Status Remapper が追加 pipeline 設定なしで `service:freee-mcp* status:error` クエリを解釈できるようになる。
  - canonical log の `msg` フィールドを HTTP status に応じた動的文字列 (`mcp request ok` / `mcp request client_error` / `mcp request server_error`) に変更。Datadog UI 上での目視判別が容易になる。
  - `makeErrorChain` を `new Error` + `Error.captureStackTrace` ベースに再実装。validation / routing 由来の synthetic error にも stack trace が付与され、Datadog から呼び出し位置を直接追跡可能。プライバシー scrub は従来通り適用。
  - pino otelMixin に `trace_sampled` フィールドを追加。アクティブな span がない場合も `trace_sampled: false` として明示的に出力するため、Datadog 上で「sampler が sampled と判定したログのみ」を facet で抽出できる(エクスポーター段階の drop は含まない)。

- [`06c5d06`](https://github.com/freee/freee-mcp/commit/06c5d060b81155fadc14668d58b004424d95cb9d): Remote モードの canonical log payload を整理し、tool/method 別の OTel sampler を導入。 ([#391](https://github.com/freee/freee-mcp/pull/391))

  - `CanonicalLogPayload` を `http` / `mcp` / `api` の 3 セクション構成に整理。`api_calls` / `api_call_count` を `api.calls` / `api.call_count` に移動し、tool 層と api 層で重複していた `api_method` / `api_path_pattern` / `query_keys` を `api.calls[]` 側に集約。
  - `query_keys` (privacy: 値ではなくキー名のみ) を `makeApiRequest` / `makeSignApiRequest` 内部で `params` から導出し、5xx / 4xx / json_parse_error / 成功すべてのパスに付与。tool 層からは消えたので、ToolCallInfo は意図として「どの MCP ツールが呼ばれたか」だけを保持する純粋メタデータとなる。
  - 新しい head-based custom sampler `RuleBasedSampler` を追加。環境変数 `OTEL_TRACES_SAMPLER_RULES` で `tool=freee_api_get:0.1,method=POST:1.0,http=GET /mcp:0.2,default=0.5` のような DSL を定義し、tool / HTTP method / inbound HTTP route 別に異なる ratio をかけられる。`OTEL_TRACES_SAMPLER_RULES` 未設定時は従来通り `OTEL_TRACES_SAMPLER_ARG` (単一 ratio) にフォールバック。DSL の構文エラーは throw せず warn ログ + skip で degrade するため、起動失敗の懸念なし。

  BREAKING (Datadog ログ検索のみ): `@api_calls.*` / `@api_call_count` / `@mcp.tool_calls.api_method` / `@mcp.tool_calls.api_path_pattern` / `@mcp.tool_calls.query_keys` を facet している既存ダッシュボードは移行が必要。新しいパスは `@api.calls.*` / `@api.call_count` / `@api.calls.method` / `@api.calls.path_pattern` / `@api.calls.query_keys`。

### Patch Changes

- [`40dd52c`](https://github.com/freee/freee-mcp/commit/40dd52c9a54a81da62cd5888f9ccdd3f73a2b8ea): Canonical log の `errors[]` が 4xx/5xx 応答で常に空になる hole を修正。 ([#392](https://github.com/freee/freee-mcp/pull/392))
  `res.status().json()` で応答を直接送出して Express エラーハンドラを bypass
  する third-party middleware のケースで `errors[]` が空のまま emit されて
  いた問題を、`flush()` の universal fallback で補完。`source: "response"`,
  `error_type: "unrecorded"` の placeholder ErrorInfo を合成し、Datadog
  operator が `status:error` で filter した後でも最低限のドリルダウン情報を
  得られるようにした。

  Fallback の `chain[0].message` には `HTTP <status> <method> <path>` を
  埋め込み、Datadog の scrubbing を通過する状態で route の特定が可能に
  なるようにした。

  body-size limit middleware (`http-server.ts`) は我々のコードなので
  fallback 経由ではなく explicit `recordError({source: "middleware",
error_type: "payload_too_large"})` を直接呼ぶように更新。

  明示的な `recordError` が呼ばれているケースでは fallback は no-op となる
  ため、既存の挙動には影響しない。

## 0.23.0

### Minor Changes

- [`a38d2be`](https://github.com/freee/freee-mcp/commit/a38d2be7717d624d30824a3f0e45ba0fb29a80f9): Remote モードのロギングを canonical log line パターンに再構成 ([#385](https://github.com/freee/freee-mcp/pull/385))

  1 HTTP リクエスト = 1 ログ行 = 1 trace の形式で、リクエスト単位のメタデータ
  (method, status, duration, tool_calls, api_calls, errors) を 1 本の JSON ログに集約して出力します。
  既存の個別イベントログ (API request completed, Tool call completed 等) は削除。

  - 新規ログフィールド: request_id, source_ip, user_id, session_id, http.\*, mcp.tool_calls[], api_calls[], errors[]
  - エラー発生時は `Error.cause` チェーンと stack trace を `errors[].chain` に含める (serialize-error 経由)
  - プライバシー保護: query 値や request body などユーザー入力はログに一切含まれない (型システムで強制)
  - 400/500 エラーも canonical log で自動捕捉 (従来ログに残らなかった 400 系をカバー)
  - pino.redact による defense-in-depth で stray log 経路からの漏洩も防止

### Patch Changes

- [`a38d2be`](https://github.com/freee/freee-mcp/commit/a38d2be7717d624d30824a3f0e45ba0fb29a80f9): Remote モードの canonical log line に inbound `user_agent` フィールドを追加、外部 freee API 向けの outbound User-Agent に transport mode (`stdio` / `remote`) を含めた ([#385](https://github.com/freee/freee-mcp/pull/385))

  - Remote: MCP クライアントから届いた `User-Agent` ヘッダを 256 文字に切り詰め、`scrubErrorMessage` で数値 ID とメールをマスクした上で canonical log line に記録。Datadog で `@user_agent:ClaudeDesktop*` のように MCP クライアント別の分析が可能になる
  - Outbound: freee API への fetch で送る User-Agent を `freee-mcp/<version> (MCP Server; stdio; +url)` / `freee-mcp/<version> (MCP Server; remote; +url)` の 2 形式に分離。freee 側ログでどの transport からの呼び出しかを区別できる
  - 新モジュール `src/server/user-agent.ts` (`getUserAgent()` / `setUserAgentTransportMode()`) が `src/constants.ts` の旧 `USER_AGENT` 定数を置き換える。初期化はエントリポイント (`src/index.ts`, `src/sign/index.ts`, `src/server/http-server.ts`) で 1 度だけ実行

## 0.22.1

### Patch Changes

- [`9883703`](https://github.com/freee/freee-mcp/commit/988370358b2a02527bd2fe5791a8e5cc384bf945): freee-api-skill の SKILL.md にカラールールセクションを追加 ([#383](https://github.com/freee/freee-mcp/pull/383))

## 0.22.0

### Minor Changes

- [`2a75c12`](https://github.com/freee/freee-mcp/commit/2a75c12e5c208e5726b68d091d3bcabc292c8674): 試算表・総勘定元帳の操作レシピを追加し、未承認仕訳（approval_flow_status）の確認フローを導入 ([#380](https://github.com/freee/freee-mcp/pull/380))

## 0.21.1

### Patch Changes

- [`61c0168`](https://github.com/freee/freee-mcp/commit/61c01686a56becdce4ddcd532eb190d282f127d2): OpenAPI スキーマを最新版に同期 ( 5 files changed, 2950 insertions(+), 753 deletions(-)) ([#378](https://github.com/freee/freee-mcp/pull/378))

## 0.21.0

### Minor Changes

- [`160b717`](https://github.com/freee/freee-mcp/commit/160b7176696e5fde79c0c8de2a12ff274f052fb9): freee サイン（電子契約）の MCP サーバーサポートを追加。`freee-sign-mcp` コマンドでサイン専用 MCP サーバーを起動し、OAuth2 認証・文書 CRUD などのサイン Public API を MCP 経由で操作可能に。 ([#375](https://github.com/freee/freee-mcp/pull/375))

## 0.20.0

### Minor Changes

- [`4b1306e`](https://github.com/freee/freee-mcp/commit/4b1306e93409d402762c4743862c13a26730559a): freee-api-skill の改善と reference 自動生成の修正 ([#369](https://github.com/freee/freee-mcp/pull/369))

  - SKILL.md にワークフローの WHY 補足と概要の価値提案追加、description の undertrigger 防止
  - レシピにメモタグ「freee-mcp」の付与ガイドを追加（freee-mcp-tag.md を新規作成）
  - 取引・経費申請・請求書などの作成例に tag_ids を追加
  - レシピの重複内容を削減し reference への参照に置き換え
  - レシピのマスタ ID ハードコードを事前取得の指示に置き換え
  - reference 自動生成の改善（空の概要フォールバック、壊れたリンク除去、description の改行改善）

## 0.19.1

### Patch Changes

- [`1eba6fc`](https://github.com/freee/freee-mcp/commit/1eba6fc76518687653447c0ce1622b61a3536a3f): OpenAPI スキーマを最新版に同期 ( 3 files changed, 2013 insertions(+), 1 deletion(-)) ([#366](https://github.com/freee/freee-mcp/pull/366))

## 0.19.0

### Minor Changes

- [`799e201`](https://github.com/freee/freee-mcp/commit/799e201ffad8158173499bb2578fdeccbd648b69): OAuth 認証完了時にデフォルト事業所を自動設定するようにした。初回認証後に current company が未設定(ID: 0)の場合、会計 API（または HR API）から事業所一覧を取得し、最初の事業所を自動で設定する。 ([#362](https://github.com/freee/freee-mcp/pull/362))

### Patch Changes

- [`546273e`](https://github.com/freee/freee-mcp/commit/546273eed194207861715f14921d8c22f6d2f348): MCP クライアントがオブジェクト型パラメータ(query/body)を JSON 文字列として送信した場合にバリデーションエラーになる問題を修正 ([#364](https://github.com/freee/freee-mcp/pull/364))

## 0.18.0

### Minor Changes

- [`03c661f`](https://github.com/freee/freee-mcp/commit/03c661fa24d412d8055c98a0f2940eb3ae2f852f): OpenTelemetry 分散トレーシングサポートを追加 ([#357](https://github.com/freee/freee-mcp/pull/357))

  - OTEL_ENABLED=true で有効化、globalThis.fetch パッチで自動計測
  - Express リクエスト/Redis 操作の span を生成
  - W3C traceparent ヘッダー伝搬
  - ParentBasedSampler によるサンプリングレート制御
  - Jaeger を docker compose で利用可能

- [`d13c0c5`](https://github.com/freee/freee-mcp/commit/d13c0c529868dccdd3dde8ea31e371f7348c2236): ロガーの強化: API リクエスト・MCP ツール実行の構造化ログを追加 ([#355](https://github.com/freee/freee-mcp/pull/355))

  - API リクエスト成功時に method/path/status/duration_ms/user_id/company_id をログ出力
  - MCP ツール呼び出し時に tool 名/service/path/duration_ms/user_id をログ出力
  - エラー時の HTTP ステータスコードとエラー種別(error_type)を構造化ログに追加
  - sanitizePath()によりクエリパラメータ値・ユーザー入力データはログに記録しない

- [`caa2db2`](https://github.com/freee/freee-mcp/commit/caa2db29e583cdebf4bf3455256de11a7ffafa16): OpenTelemetry メトリクス計測を追加（HTTP リクエスト duration/エラー、MCP ツール duration/エラー）。開発環境に OTel Collector + Prometheus + Grafana を追加。 ([#359](https://github.com/freee/freee-mcp/pull/359))
- [`6879a2a`](https://github.com/freee/freee-mcp/commit/6879a2a0f8b2cb27d802489cdf3c0d4561c180e0): MCP ツール実行に OpenTelemetry span を追加（`mcp.tool {toolName}` として Jaeger で可視化） ([#358](https://github.com/freee/freee-mcp/pull/358))

### Patch Changes

- [`b267666`](https://github.com/freee/freee-mcp/commit/b26766694c4e2f4ded99697b850b29b3443189ec): Ctrl+C 終了時に ioredis の"Connection is closed"エラーが出る問題を修正。 ([#354](https://github.com/freee/freee-mcp/pull/354))

  - シャットダウン関数に再入防止フラグを追加し、SIGINT が複数回発火しても二重実行を防止
  - シャットダウン順序を変更：HTTP サーバーを先にクローズしてから Redis をクローズすることで、処理中リクエストが閉じた接続を参照しないよう対応
  - `closeRedisClient` に quit 失敗時の disconnect フォールバックを追加

- [`4228b9e`](https://github.com/freee/freee-mcp/commit/4228b9e1d0eaa48b4ffe35c4fe8619c7c9a835af): TokenContext に companyId キャッシュを追加し Redis 重複呼び出しを最適化 ([#356](https://github.com/freee/freee-mcp/pull/356))

  - resolveCompanyId() ヘルパーで companyId を TokenContext にキャッシュ
  - 同一リクエスト内での重複 Redis GET 呼び出しを排除
  - アクセスログから company_id Redis 参照を削除（ツールログで既に記録済み）

## 0.17.1

### Patch Changes

- [`ab41118`](https://github.com/freee/freee-mcp/commit/ab411186be5070be2ad0a4427e9f5212bf591d5a): MCP SDK 1.28.0 の registerTool で引数なしツールの extra が正しく渡らない問題を修正 ([#344](https://github.com/freee/freee-mcp/pull/344))

## 0.17.0

### Minor Changes

- [`97baa3c`](https://github.com/freee/freee-mcp/commit/97baa3c98d0658ea4cae7b723802327bd5e608cf): MCP ツール定義に tool annotations を追加 ([#330](https://github.com/freee/freee-mcp/pull/330))
- [`8177270`](https://github.com/freee/freee-mcp/commit/817727010525fe5477c11f2d5dbc7fefe2718ca3): バイナリレスポンスを MIME タイプに応じて適切な MCP コンテンツタイプで返却するように改善。画像(JPEG/PNG/GIF/WebP)は ImageContent、PDF は EmbeddedResource、CSV はテキスト、その他はエラーメッセージを返却。 ([#334](https://github.com/freee/freee-mcp/pull/334))
- [`18371be`](https://github.com/freee/freee-mcp/commit/18371be729a985f657f6cd6520297092fac1a412): プラグイン名を freee-mcp に変更し、Remote MCP サーバーをプラグインに追加 ([#341](https://github.com/freee/freee-mcp/pull/341))
- [`04f9425`](https://github.com/freee/freee-mcp/commit/04f94252faafe24fc95d0cba240eb97a1d2f367d): バイナリレスポンスをファイル保存せず MCP ImageContent (base64) としてインライン返却 ([#331](https://github.com/freee/freee-mcp/pull/331))
- [`aa8097b`](https://github.com/freee/freee-mcp/commit/aa8097bf1c848d4a158f5e406d57b275f3a4fd95): @modelcontextprotocol/sdk を 1.28.0 にアップデートし、deprecated な server.tool() を server.registerTool() に移行。全ツールに title フィールドを追加。 ([#335](https://github.com/freee/freee-mcp/pull/335))

### Patch Changes

- [`60cd954`](https://github.com/freee/freee-mcp/commit/60cd954d2d97f137863a9970333dc608f7ab88b0): HTTP モードのエラーレスポンス (500/503) ログにアクセスログと同じセキュリティ関連フィールド (source_ip, session_id, company_id, user_id, method, path) を追加 ([#333](https://github.com/freee/freee-mcp/pull/333))
- [`e216516`](https://github.com/freee/freee-mcp/commit/e216516543f4f32e35d2022b01495491cb6034c8): freee_list_companies で事業所名が null の場合にバリデーションエラーになる問題を修正 ([#332](https://github.com/freee/freee-mcp/pull/332))
- [`e178099`](https://github.com/freee/freee-mcp/commit/e17809916e26fb7df9ea8be52fa79e202259e64c): README の Claude Code プラグインインストール手順を修正（marketplace 追加 → プラグインインストールの 2 段階手順に更新） ([#340](https://github.com/freee/freee-mcp/pull/340))
- [`f21ae2d`](https://github.com/freee/freee-mcp/commit/f21ae2ddc52dae9effc4a7fa22c37db69346f3d3): Remote モードで freee_authenticate ツールを非表示にする ([#338](https://github.com/freee/freee-mcp/pull/338))
- [`0d98ca3`](https://github.com/freee/freee-mcp/commit/0d98ca3f46f56ae1318b5457df8734641f3c0da5): freee_server_info にトランスポート情報(remote/stdio)を追加 ([#336](https://github.com/freee/freee-mcp/pull/336))
- [`2e09352`](https://github.com/freee/freee-mcp/commit/2e09352bd7ae18d644725168761264397b8990b8): Agent Skill のドキュメントを Remote MCP 対応に更新 ([#337](https://github.com/freee/freee-mcp/pull/337))

## 0.16.0

### Minor Changes

- [`f552919`](https://github.com/freee/freee-mcp/commit/f552919f9a1ca2c9c148f2867606f8c0e686b2b9): HTTP モードの /mcp エンドポイントに構造化アクセスログを追加（source_ip, session_id, company_id, user_id） ([#327](https://github.com/freee/freee-mcp/pull/327))

## 0.15.2

### Patch Changes

- [`2e3d530`](https://github.com/freee/freee-mcp/commit/2e3d53088b6e6f7286ed26cd4d9fb806d97d4a2f): MCP セッションをステートレス化し、マルチ Pod 環境での 404 エラーを解消 ([#325](https://github.com/freee/freee-mcp/pull/325))

## 0.15.1

### Patch Changes

- [`c03aec1`](https://github.com/freee/freee-mcp/commit/c03aec121618a73faae7f5ce43aa1594fb46ae5f): OpenAPI スキーマ同期ワークフローを修正: Claude Code ステップを廃止しシェルスクリプトに置換、リファレンス再生成・README ファイル数テーブル自動更新ステップを追加 ([#318](https://github.com/freee/freee-mcp/pull/318))
- [`9237ba6`](https://github.com/freee/freee-mcp/commit/9237ba60c9a60dcfaacfcd501daa62b001aab538): OpenAPI スキーマを最新版に同期 ( 6 files changed, 4397 insertions(+), 1922 deletions(-)) ([#319](https://github.com/freee/freee-mcp/pull/319))

## 0.15.0

### Minor Changes

- [`6c128fb`](https://github.com/freee/freee-mcp/commit/6c128fb): リモート MCP サーバー機能を追加（実験的） ([#302](https://github.com/freee/freee-mcp/pull/302))

  - `freee-mcp --remote` で Express ベースの StreamableHTTP MCP サーバーを起動可能に
  - MCP OAuth 2.1 AS 統合: mcpAuthRouter による /.well-known/\*, /authorize, /token, /register, /revoke エンドポイント
  - JWT 署名・検証モジュール（jose + HS256）、requireBearerAuth による /mcp エンドポイント保護
  - Redis ベース OAuth 状態管理（セッション、認可コード、リフレッシュトークン）とマルチテナントトークン管理
  - クライアントストア（CIMD + DCR デュアルサポート）
  - freee OAuth コールバックハンドラー（/oauth/freee-callback）
  - プロダクション強化: Redis 接続復元力、セキュリティヘッダー (helmet)、CORS、レート制限、リクエストタイムアウト、構造化ログ (pino)
  - Dockerfile、compose.yaml 追加

  注意: この機能は実験的であり、今後のリリースで破壊的変更が入る可能性があります。

- [`e947547`](https://github.com/freee/freee-mcp/commit/e947547): stdio モードと HTTP リモートサーバーモードのバイナリを分離: `bin/cli.js` → `bin/freee-mcp.js` + `bin/freee-remote-mcp.js` ([#306](https://github.com/freee/freee-mcp/pull/306))

## 0.14.0

### Minor Changes

- [`89a26b5`](https://github.com/freee/freee-mcp/commit/89a26b5): freee_server_info ツールを追加。サーバーの情報（バージョンなど）を取得できるようになりました。リリース時にスキル ZIP に VERSION.md を同梱し、スキルとサーバーのバージョン比較が可能に。 ([#299](https://github.com/freee/freee-mcp/pull/299))

## 0.13.1

### Patch Changes

- [`0e194ff`](https://github.com/freee/freee-mcp/commit/0e194ff): package.json に prepare スクリプトを追加し、GitHub リポジトリから直接インストール時に自動ビルドが実行されるようにした ([#296](https://github.com/freee/freee-mcp/pull/296))
- [`a26ecfb`](https://github.com/freee/freee-mcp/commit/a26ecfb): `freee-mcp configure` 実行時のバナーにバージョン番号を表示するようにした ([#295](https://github.com/freee/freee-mcp/pull/295))

## 0.13.0

### Minor Changes

- [`c7d55a3`](https://github.com/freee/freee-mcp/commit/c7d55a3): `configure --force` オプションを追加。保存済みのログイン情報（トークン・設定ファイル）をリセットして再設定できるようにした。 ([#290](https://github.com/freee/freee-mcp/pull/290))
- [`37edff1`](https://github.com/freee/freee-mcp/commit/37edff1): 開発ツールチェーンを bun に移行: パッケージマネージャ (pnpm → bun)、バンドラ (esbuild → Bun.build)、スクリプト実行 (tsx → bun)。テストは vitest を維持。CI/CD を bun ベースに更新。 ([#283](https://github.com/freee/freee-mcp/pull/283))

### Patch Changes

- [`6ca07dc`](https://github.com/freee/freee-mcp/commit/6ca07dc): configure コマンドでポート番号に不正な値を入力した場合に、次回 configure が起動しなくなるバグを修正。入力時のバリデーション追加と、config.json の読み込み時に null 値を許容するよう修正。 ([#291](https://github.com/freee/freee-mcp/pull/291))
- [`5903d74`](https://github.com/freee/freee-mcp/commit/5903d74): TokenStore インターフェースを導入。将来のリモートデプロイ（Redis 等）に向けた内部構造の改善で、stdio モードの動作変更はありません。 ([#289](https://github.com/freee/freee-mcp/pull/289))

## 0.12.1

### Patch Changes

- [`f8873e4`](https://github.com/freee/freee-mcp/commit/f8873e4): エラーハンドリングの共通ヘルパー関数抽出とスキーマパス検証の regex キャッシュ化によるリファクタリング ([#281](https://github.com/freee/freee-mcp/pull/281))
- [`ff3e506`](https://github.com/freee/freee-mcp/commit/ff3e506): freee_api_delete が HTTP 204 No Content レスポンスで JSON パースエラーとなる問題を修正 ([#284](https://github.com/freee/freee-mcp/pull/284))
- [`83251cb`](https://github.com/freee/freee-mcp/commit/83251cb): freee-api-skill の description に具体的な操作キーワードを追加してトリガー率を改善 ([#280](https://github.com/freee/freee-mcp/pull/280))
- [`fb11574`](https://github.com/freee/freee-mcp/commit/fb11574): ESLint + Prettier を Biome に移行 ([#286](https://github.com/freee/freee-mcp/pull/286))

## 0.12.0

### Minor Changes

- [`441d1e4`](https://github.com/freee/freee-mcp/commit/441d1e4): --remote オプションを追加。リモート MCP サーバーとして動作させる際にファイルアップロード機能を無効化 ([#278](https://github.com/freee/freee-mcp/pull/278))
- [`564777b`](https://github.com/freee/freee-mcp/commit/564777b): configure コマンドで会計 API から事業所一覧を取得できない場合に、人事労務 API へフォールバックするように改善。人事労務のみ利用しているユーザーでも事業所を選択できるようになりました。 ([#277](https://github.com/freee/freee-mcp/pull/277))

### Patch Changes

- [`42255f2`](https://github.com/freee/freee-mcp/commit/42255f2): configure コマンドの事業所選択プロンプトに操作ヒント（↑↓ で選択、Enter で確定）を追加し、表現を「操作対象の事業所」に統一 ([#273](https://github.com/freee/freee-mcp/pull/273))

## 0.11.2

### Patch Changes

- [`bc135be`](https://github.com/freee/freee-mcp/commit/bc135be): API 要望の案内先を freee サポートページから freee Public API リクエストフォームに変更 ([#270](https://github.com/freee/freee-mcp/pull/270))

## 0.11.1

### Patch Changes

- [`8c964bf`](https://github.com/freee/freee-mcp/commit/8c964bf): API の機能制限に関する問い合わせを freee プロダクトのフィードバックに誘導するガイダンスを SKILL とトラブルシューティングに追加 ([#268](https://github.com/freee/freee-mcp/pull/268))

## 0.11.0

### Minor Changes

- [`32fab73`](https://github.com/freee/freee-mcp/commit/32fab73): 工数管理レシピの拡充: 全 PM エンドポイントのカバレッジ追加と、PM・HR 連携による安全な工数登録ワークフローレシピの新規追加 ([#262](https://github.com/freee/freee-mcp/pull/262))

### Patch Changes

- [`cc24426`](https://github.com/freee/freee-mcp/commit/cc24426): MCP サーバーに instructions を追加し、全ツールの description に freee-api-skill skill へのガイド参照を追加 ([#257](https://github.com/freee/freee-mcp/pull/257))
- [`ace37e0`](https://github.com/freee/freee-mcp/commit/ace37e0): PM/SM API 操作レシピを追加し company_id 指定方法を明記、取引 URL フォーマットを修正 ([#259](https://github.com/freee/freee-mcp/pull/259))
- [`cc24426`](https://github.com/freee/freee-mcp/commit/cc24426): publish workflow の skill zip ファイル名を freee-api-skill.zip に修正 ([#257](https://github.com/freee/freee-mcp/pull/257))
- [`cc24426`](https://github.com/freee/freee-mcp/commit/cc24426): サーバーバージョンをハードコードから package.json の値に同期するよう変更 ([#257](https://github.com/freee/freee-mcp/pull/257))

## 0.10.0

### Minor Changes

- [`d93e78b`](https://github.com/freee/freee-mcp/commit/d93e78b): ファイルボックスへのファイルアップロード用カスタムツール (freee_file_upload) を追加 ([#252](https://github.com/freee/freee-mcp/pull/252))

### Patch Changes

- [`78d94ed`](https://github.com/freee/freee-mcp/commit/78d94ed): Claude Desktop のスキルアップロード手順の UI パスを最新のものに更新 ([#253](https://github.com/freee/freee-mcp/pull/253))
- [`b94976d`](https://github.com/freee/freee-mcp/commit/b94976d): Fix `claude plugin add` to `claude plugin install` in README and publish workflow ([#254](https://github.com/freee/freee-mcp/pull/254))
- [`87abec4`](https://github.com/freee/freee-mcp/commit/87abec4): Windows Store (MSIX) 版 Claude Desktop の設定ファイルパスに対応。Store 版のパッケージディレクトリが存在する場合、自動的に正しいパスを使用します。 ([#247](https://github.com/freee/freee-mcp/pull/247))

## 0.9.1

### Patch Changes

- [`69622a3`](https://github.com/freee/freee-mcp/commit/69622a3): スキルドキュメントを整理し company_id の扱いを明確化 ([#242](https://github.com/freee/freee-mcp/pull/242))

## 0.9.0

### Minor Changes

- [`3fb6f22`](https://github.com/freee/freee-mcp/commit/3fb6f22): 人事労務(有給申請)・工数管理・販売 API のリファレンスドキュメントを追加し、リファレンス生成スクリプトを改善 ([#240](https://github.com/freee/freee-mcp/pull/240))

### Patch Changes

- [`dab48e3`](https://github.com/freee/freee-mcp/commit/dab48e3): ツールの説明文や使用例から invoice API の例示を deal 一覧取得の例に置き換え ([#239](https://github.com/freee/freee-mcp/pull/239))

## 0.8.1

### Patch Changes

- [`62e8483`](https://github.com/freee/freee-mcp/commit/62e8483): CSV レスポンスが JSON として処理される不整合を修正。isBinaryContentType に text/csv を追加し、CSV レスポンスが正しくファイルとして保存されるようにしました。 ([#229](https://github.com/freee/freee-mcp/pull/229))
- [`aa42fef`](https://github.com/freee/freee-mcp/commit/aa42fef): refresh_token が欠落している場合に空文字列を保存する代わりにエラーを返すようにし、再認証を促すメッセージを表示するようにした ([#230](https://github.com/freee/freee-mcp/pull/230))
- [`cb2e717`](https://github.com/freee/freee-mcp/commit/cb2e717): 環境変数の部分設定（FREEE_CLIENT_ID または FREEE_CLIENT_SECRET の片方のみ）でエラーを返すように修正 ([#231](https://github.com/freee/freee-mcp/pull/231))
- [`3a3346e`](https://github.com/freee/freee-mcp/commit/3a3346e): FREEE_CALLBACK_PORT の値検証を追加し、不正な値（NaN、範囲外）の場合はデフォルトポートにフォールバックするようにした

## 0.8.0

### Minor Changes

- [`806aa41`](https://github.com/freee/freee-mcp/commit/806aa41): 各サービスの API ベース URL を環境変数で切り替え可能にする機能を追加。FREEE*API_BASE_URL*{SERVICE}（ACCOUNTING, HR, INVOICE, PM, SM）環境変数でサービスごとの接続先を上書きできます。

### Patch Changes

- [`93222c3`](https://github.com/freee/freee-mcp/commit/93222c3): スキルの docs/ ディレクトリを recipes/ にリネーム（ユースケースサンプル集であることを明確化）
- [`d615b70`](https://github.com/freee/freee-mcp/commit/d615b70): README.md の skills インストーラー CLI の参照を `add-skill` から `skills` に更新

## 0.7.3

### Patch Changes

- [`7d84fd6`](https://github.com/freee/freee-mcp/commit/7d84fd6): 勤怠操作ガイド(hr-attendance-operations.md)を新設し、hr-operations.md を hr-employee-operations.md にリネーム・整理

## 0.7.2

### Patch Changes

- [`1ea4571`](https://github.com/freee/freee-mcp/commit/1ea4571): npm publish を Trusted Publishing (OIDC) に移行し、NPM_TOKEN シークレットを不要に

## 0.7.1

### Patch Changes

- [`3f3fe54`](https://github.com/freee/freee-mcp/commit/3f3fe54): npm パッケージ名を @him0/freee-mcp から freee-mcp に変更したことに伴い、全ファイルの参照を更新

## 0.7.0

### Minor Changes

- [`c47692c`](https://github.com/freee/freee-mcp/commit/c47692c): configure 完了後に Skill インストールの案内を表示するように改善。Claude Code には `npx add-skill` コマンド、Claude Desktop には Releases から freee-skill.zip をダウンロードする手順を案内。

### Patch Changes

- [`e91f75f`](https://github.com/freee/freee-mcp/commit/e91f75f): configure コマンドでコールバック URL を分かりやすく表示するように改善

## 0.6.7

### Patch Changes

- [`a3766e0`](https://github.com/freee/freee-mcp/commit/a3766e0): OpenAPI スキーマを最新版に更新: 会計 API に経費申請制限事項とテンプレート ID フィールド追加、人事労務 API に所定休日労働時間フィールド追加、販売 API に案件更新・受注更新エンドポイント追加

## 0.6.6

### Patch Changes

- [`d2147d3`](https://github.com/freee/freee-mcp/commit/d2147d3): freee API が name: null の事業所を返す場合に configure コマンドが失敗する問題を修正
- [`d055c47`](https://github.com/freee/freee-mcp/commit/d055c47): fix: トークン交換の失敗をブラウザに正しく表示

  トークン交換を待ってから結果に応じてブラウザに応答を返すように修正。エラー時は「認証エラー」（HTTP 500）を表示し、エラーがサイレントに無視されないようにした。

## 0.6.5

### Patch Changes

- [`988121f`](https://github.com/freee/freee-mcp/commit/988121f): Add User-Agent header to OAuth token refresh and token exchange requests

## 0.6.4

### Patch Changes

- [`74a2f5b`](https://github.com/freee/freee-mcp/commit/74a2f5b): fix: エラーメッセージ内の誤ったツール名を修正 (freee_set_company → freee_set_current_company, 旧ツール名 → freee_api_get)

## 0.6.3

### Patch Changes

- [`8b27a9f`](https://github.com/freee/freee-mcp/commit/8b27a9f): freee-agent パッケージを private に設定し、npm publish 対象から除外

## 0.6.2

### Patch Changes

- [`9ab8bc6`](https://github.com/freee/freee-mcp/commit/9ab8bc6): 0.6.2 リリース: 1/17 以降の変更を含む

  このリリースには以下の改善が含まれています（CHANGELOG 0.6.1 に既に記載済みの内容）:

  - 外部 API へのリクエストに User-Agent ヘッダーを追加
  - 外部 API レスポンスの Zod バリデーション追加
  - OAuth コールバックサーバーのエラーハンドリング改善
  - 403 エラーのハンドリング改善（レートリミット対応）
  - トークンエラーハンドリングの改善（Result 型パターン）
  - OAuth コールバックサーバーのオンデマンド起動
  - ポート使用中時のエラーメッセージ改善

## 0.6.1

### Patch Changes

- [`4b941b6`](https://github.com/freee/freee-mcp/commit/4b941b6): 外部 API へのリクエストに User-Agent ヘッダーを追加し、MCP サーバーからのリクエストであることを識別可能に
- [`a803a3e`](https://github.com/freee/freee-mcp/commit/a803a3e): Add Zod validation for external API responses to prevent silent failures from invalid response formats
- [`f79175d`](https://github.com/freee/freee-mcp/commit/f79175d): fix: improve error handling for OAuth callback server startup failures

  - Add explicit error messages when OAuth callback server fails to start
  - Log when server is already running instead of silently returning
  - Clean up server state properly on error

- [`a6b4a4c`](https://github.com/freee/freee-mcp/commit/a6b4a4c): fix: 403 エラーのハンドリングを改善し、レートリミットの可能性を示すメッセージを追加
- [`230cbf8`](https://github.com/freee/freee-mcp/commit/230cbf8): fix: improve token error handling with Result type pattern

  - Replace safeParseJson with parseJsonResponse that returns a Result type, preserving error context instead of silently returning empty object
  - Propagate token refresh errors in getValidAccessToken instead of returning null, allowing callers to understand failure reasons
  - Add comprehensive tests for parseJsonResponse and token refresh failure scenarios

- [`b2ac012`](https://github.com/freee/freee-mcp/commit/b2ac012): OAuth コールバックサーバーを MCP サーバー起動時ではなく、認証時にオンデマンドで起動するように変更
- [`d4f96c0`](https://github.com/freee/freee-mcp/commit/d4f96c0): ポートが使用中の場合にフォールバックせず、具体的な解決方法を含むエラーメッセージを表示するように変更
