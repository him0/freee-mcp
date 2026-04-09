# freee-mcp

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
