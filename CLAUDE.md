# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 最重要: Next.js 16 は学習データと異なる

このプロジェクトは Next.js 16.4 / React 19.3 を使用しており、API・規約・ファイル構成が従来版から変わっている。コードを書く前に `node_modules/next/dist/docs/` 内の該当ガイドを読み、非推奨の警告に従うこと（`01-app/` が App Router 用）。`AGENTS.md` は `next dev` が自動生成・再追加するファイルなので、差分から消さずそのままコミットしてよい。

## コマンド

```bash
npm run dev                # 開発サーバー (http://localhost:3000)
npm run build              # 本番ビルド
npm run lint               # ESLint (flat config: eslint.config.mjs)
npx tsc --noEmit           # 型チェック
npm test                   # Vitest をウォッチモードで実行
npm run test:run           # Vitest を1回だけ実行 (CI 向け)
npx vitest run src/__tests__/page.test.tsx   # 単一ファイルを実行
npx vitest run -t "見出し"                    # テスト名で絞り込み
```

## アーキテクチャ

- **App Router + `src/` 構成**: ルートは `src/app/` 配下。パスエイリアス `@/*` → `./src/*`。
- **Cache Components が有効** (`next.config.ts` の `cacheComponents: true` + `partialPrefetching: true`): データ取得はデフォルトで動的で、キャッシュしたい箇所に `use cache` / `cacheLife` / `cacheTag` を明示する。静的シェルを先に返し動的部分はストリーミングされる。Node.js ランタイム必須のため、ルートに `runtime` セグメント設定を export してはいけない。従来の `revalidate` / `dynamic` などのセグメント設定を使う前に `01-app/02-guides/migrating-to-cache-components.md` を確認すること。
- **Tailwind CSS v4 は Turbopack ローダー経由**: PostCSS 設定はなく、`next.config.ts` の `turbopack.rules` で `@tailwindcss/turbopack` を `*.css` に適用している。`tailwind.config.*` も存在せず、テーマは `src/app/globals.css` の `@theme inline` で CSS 変数として定義する（`--background` / `--foreground`、ダークモードは `prefers-color-scheme`）。
- **型付きルート props**: `LayoutProps<"/">` などのグローバル型ヘルパーを使う（Next.js が生成する型。`.next/types` に出力される）。

## Supabase

- **プロジェクト**: `task-kanban`（ref `zyfeylmxsswukbtaphai`、リージョン ap-south-1）。スキーマ・キー・ログの確認は Supabase MCP で行う。
- **環境変数**: `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（キー一覧は `.env.example`、実際の値は `.env.local`）。キーはレガシーの anon キー（JWT）ではなく publishable key（`sb_publishable_...`）を使う。`process.env` を直接読まず `src/lib/supabase/env.ts` の `getSupabaseEnv()` を経由する（未設定時は日本語のエラーを投げる）。
- **クライアントの使い分け**（`@supabase/ssr`）:
  - Server Component / Server Action / Route Handler → `src/lib/supabase/server.ts` の `createClient()`（async。内部で `await cookies()` する）
  - Client Component → `src/lib/supabase/client.ts` の `createClient()`
  - 同名関数なので import パスで区別する。サーバー用は `next/headers` に依存するため Client Component から import しない。
- **起動時の接続確認**: `src/instrumentation.ts` の `register()` が Node.js ランタイムで1回だけ `checkSupabaseConnection()`（`src/lib/supabase/check-connection.ts`）を実行し、失敗時のみ `console.error` を出す（成功時は何も出さない）。Auth のヘルスチェック `/auth/v1/health` を使うため、URL とキーの正しさは確認できるが、DB 本体への疎通確認ではない。
- **ログ**: `next dev` のサーバーログは `.next/dev/logs/next-development.log` にも出力される。
- **未整備のもの**（必要になったら追加する）:
  - セッション更新用の Proxy（旧 middleware）。認証を導入するときに必要。Next.js 16 の Proxy 規約は `node_modules/next/dist/docs/` で確認すること。
  - DB の型定義。テーブル作成後に Supabase MCP の `generate_typescript_types` で生成し、`createClient<Database>()` に渡す。
  - RLS ポリシー。publishable key はブラウザに公開されるため、テーブルを作ったら必ず RLS を有効にしてポリシーを設定する。
- **テスト**: Supabase への通信は外部依存なので `vi.stubGlobal("fetch", ...)` でモックし、環境変数は `vi.stubEnv` で設定する（例: `src/__tests__/check-connection.test.ts`）。

## コーディングルール
- 変更後は必ず `npm test` でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名・関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テスト

- Vitest 5 + React Testing Library + jsdom。設定は `vitest.config.mts`、セットアップは `vitest.setup.ts`（`@testing-library/jest-dom/vitest` のマッチャー読み込みと `cleanup`）。
- テストファイルは `src/**/*.{test,spec}.{ts,tsx}` のみが対象。現状は `src/__tests__/` に置いている。
- tsconfig パスは Vite ネイティブの `resolve.tsconfigPaths: true` で解決している（`vite-tsconfig-paths` プラグインは非推奨のため不使用）。
- `async` な Server Component は Vitest で描画できない。同期コンポーネントのみユニットテストし、async コンポーネントは E2E で検証する。

## テストルール
- 網羅性：正常系・異常系・境界値を検討してください
- 可読性：テスト名に条件と期待する結果を明示してください
- 保守性：実装の内部構造ではなくユーザーから見た振る舞いをテストしてください
- 独立性：テスト間で状態を共有しないでください
- 状態遷移：画面遷移の順方向・逆方向を検討してください
- モック方針：外部依存のみモック化してください

## 禁止事項
- console.logを本番コードに残さないでください
- 既存のテストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- Next.js・Supabase・Vitestなどの最新仕様はContext7 MCPを使って公式ドキュメントを確認してください