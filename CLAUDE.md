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
- **Tailwind CSS v4 は Turbopack ローダー経由**: PostCSS 設定はなく、`next.config.ts` の `turbopack.rules` で `@tailwindcss/turbopack` を `*.css` に適用している。`tailwind.config.*` も存在せず、テーマは `src/app/globals.css` の `@theme inline` で CSS 変数として定義する（shadcn/ui のテーマ変数。下記参照）。
- **ダークモードは `prefers-color-scheme` 方式**: `globals.css` で `@custom-variant dark (@media (prefers-color-scheme: dark));` とし、ダーク用の変数は `@media (prefers-color-scheme: dark) { :root { ... } }` に置いている。`.dark` クラスはどこにも付けていない。
- **型付きルート props**: `LayoutProps<"/">` などのグローバル型ヘルパーを使う（Next.js が生成する型。`.next/types` に出力される）。

## shadcn/ui

- **構成**: `components.json` で style `base-nova`（プリミティブは Radix ではなく **Base UI** = `@base-ui/react`）、baseColor `neutral`、アイコンは `lucide-react`。alias は `@/components/ui`（生成コンポーネント）、`@/lib/utils`、`@/hooks`。
- **追加**: `npx shadcn@latest add <名前>` で `src/components/ui/` に生成される。生成ファイルは自分のコードとして編集してよい。ドキュメントやサンプルを見るときは Radix 版ではなく Base UI 版（`components/base/...`）を参照する（props や合成の仕方が異なる）。
- **`cn`**: `src/lib/utils.ts` は公式の `cn` パッケージ（clsx + tailwind-merge の代替）を再 export しているだけ。生成コンポーネントは `"cn"` から直接 import している。
- **CLI 実行後は `globals.css` の差分を必ず確認する**: `init`（再実行や `--reinstall` を含む）は以下を既定値に戻すことがあるので、戻されていたら直す。
  - `@custom-variant dark (&:is(.dark *));` と `.dark { ... }` に書き換わる → 上記の `prefers-color-scheme` 方式に戻す（戻さないと `dark:` が全部効かなくなる）。
  - `--font-sans: var(--font-sans);`（自己参照）になる → `var(--font-geist-sans)` に戻す（`layout.tsx` の `next/font` が定義している変数）。
- **テーマ変数**: `--background` / `--foreground` / `--primary` / `--muted` / `--border` / `--destructive` などを `oklch` で定義し、`bg-primary`・`text-muted-foreground` などのユーティリティとして使える。`shadcn` パッケージは `@import "shadcn/tailwind.css"` のために dependencies に必要（削除しない）。

## Supabase

- **プロジェクト**: `task-kanban`（ref `zyfeylmxsswukbtaphai`、リージョン ap-south-1）。スキーマ・キー・ログの確認は Supabase MCP で行う。
- **環境変数**: `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（キー一覧は `.env.example`、実際の値は `.env.local`）。キーはレガシーの anon キー（JWT）ではなく publishable key（`sb_publishable_...`）を使う。`process.env` を直接読まず `src/lib/supabase/env.ts` の `getSupabaseEnv()` を経由する（未設定時は日本語のエラーを投げる）。
- **クライアントの使い分け**（`@supabase/ssr`）:
  - Server Component / Server Action / Route Handler → `src/lib/supabase/server.ts` の `createClient()`（async。内部で `await cookies()` する）
  - Client Component → `src/lib/supabase/client.ts` の `createClient()`
  - 同名関数なので import パスで区別する。サーバー用は `next/headers` に依存するため Client Component から import しない。
- **起動時の接続確認**: `src/instrumentation.ts` の `register()` が Node.js ランタイムで1回だけ `checkSupabaseConnection()`（`src/lib/supabase/check-connection.ts`）を実行し、失敗時のみ `console.error` を出す（成功時は何も出さない）。Auth のヘルスチェック `/auth/v1/health` を使うため、URL とキーの正しさは確認できるが、DB 本体への疎通確認ではない。
- **ログ**: `next dev` のサーバーログは `.next/dev/logs/next-development.log` にも出力される。
- **スキーマ変更**: Supabase MCP の `apply_migration` で行い、適用後に `get_advisors`（security）で確認する。
  - migration はリポジトリにファイルとして残していない（`supabase/` ディレクトリなし）。履歴は MCP の `list_migrations` で確認する。適用済み: `create_tasks`、`grant_tasks_to_anon`。
  - 型は `generate_typescript_types` で再生成し、`src/lib/supabase/database.types.ts` を丸ごと置き換える（手で編集しない）。
  - **新しいテーブルには API ロールの権限が自動で付かない**。RLS ポリシーとは別に `grant select, insert, update, delete on table ... to anon;` が必要。付け忘れると `42501 permission denied` になる。テーブル作成と同じ migration に GRANT を含めること。
  - advisors は「anon に全操作を許可するポリシー」を警告しない（0件でも安全とは限らない）。ポリシーの中身は自分で確認する。
  - 関数を作るときは `set search_path = ''` を付ける（advisors の警告対象になるため）。
- **`tasks` テーブル**: `id` uuid / `title` text（前後空白除去後 1〜100 文字）/ `description` text（〜1000 文字、既定 `''`）/ `status` enum `task_status`（`todo` / `in_progress` / `done`）/ `created_at` / `updated_at`（トリガー `set_updated_at` で自動更新）。
  - 文字数ルールは DB の check 制約と `src/lib/tasks/validation.ts` の `validateTaskInput()` で揃えている。片方を変えたらもう片方も変える。
- **認証と RLS**: 認証は未導入。RLS は有効で、anon に全操作を許可するポリシーを付けている（URL とキーを知っていれば誰でも読み書きできる）。認証を入れるときは `user_id` 列の追加、ポリシーの作り直し、Server Action でのユーザー確認が必要。
- **未整備のもの**（必要になったら追加する）:
  - セッション更新用の Proxy（旧 middleware）。認証を導入するときに必要。Next.js 16 の Proxy 規約は `node_modules/next/dist/docs/` で確認すること。
  - 並び順の列（列の中での並べ替えを入れるとき）。今は `created_at` の昇順で表示している。ドラッグ＆ドロップは列の移動（ステータス変更）だけに対応している。
- **テスト**: Supabase への通信は外部依存なのでモックし、環境変数は `vi.stubEnv` で設定する。
  - `fetch` を直接呼ぶ処理 → `vi.stubGlobal("fetch", ...)`（例: `src/__tests__/check-connection.test.ts`）
  - Supabase クライアントを使う処理 → `vi.mock("@/lib/supabase/server")` でクエリビルダーを差し替える（例: `src/__tests__/app/actions.test.ts`）。クエリビルダーは thenable なので、`createClient()` の戻り値そのものを thenable にしないこと（`await` で解決されてしまう）。
- **実 DB での動作確認**: `.env.local` の値は表示・ログ出力しない。読むときは `node --env-file=.env.local` で一時スクリプトを実行し、publishable key（= ブラウザと同じ anon 権限）で Server Action と同じクエリを試す。一時スクリプトは `@supabase/supabase-js` を解決できるようにプロジェクト直下に置き、終わったら削除する。確認用に入れたデータは MCP の `execute_sql` で消す。

## アプリの構成と実装パターン

- **データの流れ**（カンバン = `/`）:
  - `src/app/page.tsx`（同期。h1 と `<Suspense>` だけ）→ `_components/task-board-loader.tsx`（async Server Component が取得）→ `_components/kanban-board.tsx`（Client Component）
  - 変更処理は `src/app/actions.ts` の Server Action（`createTask` / `updateTask` / `deleteTask`）。
  - 画面への即時反映は、Server Action の戻り値で `KanbanBoard` のローカル状態（`useState(initialTasks)`）を更新して行う。`refresh()` / `revalidatePath` は使っていない。ページは動的に描画されるので、再読み込みすれば DB の最新状態になる。
  - 例外はドラッグ＆ドロップでの列の移動。保存を待たずに先にローカル状態を変え（`src/lib/tasks/move.ts` の `changeTaskStatus`）、失敗したらそのタスクだけ元のステータスに戻して `Alert` でエラーを出す。保存は既存の `updateTask` に `toTaskFormData(task, status)` を渡して行う。
  - Server Action は import せず、props で Client Component に渡す（テストで `vi.fn()` に差し替えるため）。
  - `server.ts` の `createClient()` は `cookies()` を使うので、`use cache` の中では呼べない。キャッシュしたくなったら Cookie を使わないクライアントを別に用意する。
- **ファイル配置**:
  - ルート専用の UI → `src/app/_components/`（`_` 付きでルーティング対象外）
  - shadcn/ui の汎用コンポーネント → `src/components/ui/`（CLI が生成）。ルート専用の UI からはこれを組み合わせて使う
  - ドメインの型と純粋ロジック → `src/lib/<ドメイン>/`（例: `src/lib/tasks/types.ts`、`validation.ts`）
  - DB の行型は `database.types.ts` から派生させる（`Tables<"tasks">`）。自前で型を書き直さない。
- **Server Action の書き方**（`src/app/actions.ts` を手本にする）:
  - 例外は投げず、`ActionResult<T>`（`{ ok: true, data } | { ok: false, error }`、`src/lib/tasks/types.ts`）を返す。エラーメッセージは画面にそのまま出す日本語にする。
  - 処理の順番: 入力検証 → `createClient()` → クエリ → エラーの変換。検証で弾けるものは DB に接続する前に返す。
  - 0件の判定: `.update().eq().select().single()` は対象がないと `PGRST116` エラーを返す。`.delete()` は0件でもエラーにならないので、`.select("id")` を付けて空配列かどうかで判定する。
  - 認証を入れたら、各 Server Action の先頭でユーザーを確認する（Server Action は直接 POST でも呼べる）。
- **フォームの書き方**（`_components/task-form.tsx` を手本にする）:
  - 非制御コンポーネント（`defaultValue`）で書き、`FormData` で値を読む。追加に成功したら `form.reset()` で空にする。
  - クライアントでも `validateTaskInput()` で検証し、通ったものだけ Server Action に送る。Server Action 側でも同じ関数で必ず再検証する。
  - 送信中は `useTransition` の `isPending` でボタンを無効にし、ラベルを「追加中…」「保存中…」に変える。
  - `onSubmit` は「成功なら `null`、失敗ならエラーメッセージ」を返す関数として受け取る。
  - 文字数は `Array.from(value).length` で数える（DB の `char_length` と同じく、絵文字を1文字として扱うため）。
- **UI の決まりごと**（テストのクエリがこれに依存している。変えるときはテストも直す）:
  - 文言はすべて日本語。
  - 列は `<section aria-label="未着手">`（role `region`）、カードは `<article aria-label={タイトル}>`、フォームは `<form aria-label="タスクを追加">`。
  - エラーは `role="alert"` で表示する。
  - 取り消せない操作の確認は `_components/confirm-dialog.tsx`（shadcn の `AlertDialog` = Base UI。`role="alertdialog"`）を使う。`open` で開閉し常時マウントしておく（閉じるアニメーションのため）。初期フォーカスはキャンセル（`initialFocus`）、Esc で閉じる。`window.confirm` は使わない。
  - 見た目のルールは下の「デザインルール」に従う。
  - セレクトは Base UI の `Select` ではなく `NativeSelect`（ネイティブの `<select>`）を使う。テストが `user.selectOptions` / `toHaveValue` に依存しているため。
  - アイコンだけのボタンは `aria-label` でアクセシブル名を付ける（例: カードの「編集」「削除」）。Base UI の `Button` は既定が `type="button"` なので、送信ボタンには `type="submit"` を明示する。
  - ドラッグ＆ドロップは `@dnd-kit/react`（`DragDropProvider` は `KanbanBoard`、`useDroppable` は `TaskColumn`（id = ステータス）、`useDraggable` は `TaskCard`（id = タスク id））。ドラッグはカードの「ドラッグして移動」ハンドルからだけ始める（編集・削除ボタンと競合させないため）。編集中はハンドルを出さず、`article` に `ref` もつながない（つなぐと dnd-kit が `role="button"` などを付け、`article` として取得できなくなる）。
  - 上記の aria-label・role・文言は保つ（テストが依存している）。

## デザインルール

shadcn/ui（base-nova / neutral）の見た目を土台に、余白と角丸を大きめにとった落ち着いたトーンにそろえる。新しい画面や部品を作るときは、既存の `src/app/_components/` と見た目を合わせる。

- **部品の選び方**: まず `src/components/ui/` の shadcn/ui を使う（`Card` / `Button` / `Input` / `Textarea` / `Label` / `NativeSelect` / `Badge` / `Alert` / `AlertDialog`）。足りなければ `npx shadcn@latest add` で追加し、Tailwind で一から組むのは最後の手段にする。生成ファイルを直すのは、全体に効かせたい変更のときだけ。個別の調整は使う側の `className` で行う。
- **色**:
  - テーマ変数のユーティリティだけを使う（`bg-background` / `bg-card` / `bg-muted` / `text-foreground` / `text-muted-foreground` / `bg-primary` / `text-destructive` / `ring-foreground/10` など）。`zinc-*`・`gray-*`・`#hex` は直書きしない。テーマ変数ならダークモードも自動で切り替わるので `dark:` は付けない。
  - 色に意味を持たせるのはステータスだけ。未着手 = slate、進行中 = amber、完了 = emerald。定義は `task-column.tsx` の `STATUS_ACCENTS` にまとめ、ここだけライト・ダーク両方の値（`dark:`）を書く。新しいステータス色もここに足す。
  - 危険な操作とエラーは `destructive` を使う（削除ボタンのホバー、`Alert variant="destructive"`、フォームのエラー文）。
  - 主ボタンは `bg-primary`（ライトでは黒、ダークでは白）。1つのフォームに主ボタンは1つまで。
- **レイアウト**:
  - ページは `max-w-6xl` で中央寄せ、左右 `px-4`、上下 `py-8 sm:py-12`。セクションどうしの間隔は `gap-6`〜`gap-8`。
  - 背景は `bg-gradient-to-b from-muted/70 via-background to-background` の薄いグラデーション。
  - カンバンの列は `md:grid-cols-3` で、モバイルでは縦に積む。`items-start` にして、列ごとの高さは中身に合わせる。
  - 追加フォームは `md` 以上でタイトルと説明を横に並べる（2:3）。カード内の編集フォームは縦1列にする。
- **形と奥行き**:
  - 角丸は外側ほど大きくする。列 `rounded-2xl` → カード `rounded-xl` → 入力欄とボタン `rounded-lg`。
  - 枠は `border` ではなく `ring-1 ring-foreground/10` で付け、影は控えめにする（`shadow-xs`、ホバー時だけ `shadow-md`）。
  - 列は `bg-muted/60`（ダークは `dark:bg-muted/30`）のレーンにする。枠はカードより薄い `ring-foreground/5` にし、上端にステータス色のライン（`h-1`）を引く。
- **文字**:
  - h1 は `text-2xl font-semibold tracking-tight`。カードや列の見出しは `text-sm font-semibold`（カードのタイトルは `font-medium`）。補足文は `text-sm text-muted-foreground`。
  - 件数などの数字には `tabular-nums` を付ける。ユーザーが入力した文字列には `break-words` を付ける（説明はさらに `whitespace-pre-wrap`）。
- **アイコン**:
  - `lucide-react` だけを使う。基本は `size-4`。空の状態に置くアイコンは `size-5`、ヘッダーのロゴは `size-5` を `size-10` の `rounded-xl bg-primary` の箱に入れる。
  - 飾りのアイコンには `aria-hidden="true"` を付ける。アイコンだけのボタンは `aria-label` と `title` を付ける。
- **ボタン**: 主操作は `default`、キャンセルは `outline`、カードの中の操作は `ghost` + `size="icon-sm"`、削除の確定は `destructive`。カードの中の操作ボタンは、`md` 以上では普段は薄く（`opacity-40`）し、ホバー時とフォーカス時に濃くする。タッチ端末では常に表示する。
- **状態の見せ方**:
  - 空の列は、破線の枠（`border-dashed border-foreground/15`）に、アイコンと「タスクはありません」を置く。
  - 読み込み中は `LoaderCircle` の `animate-spin` と文言を並べて出す。
  - 入力エラーは、フォームの中に `CircleAlert` を付けた `text-destructive` の文で出し、入力欄には `aria-invalid` を付ける。画面全体のエラーは `Alert variant="destructive"` で出す。
  - 確認ダイアログは `AlertDialogMedia` に警告アイコン（`bg-destructive/10 text-destructive`）を置く。
- **確認のしかた**: デザインを変えたら Playwright MCP でスクリーンショットを撮り、ライト・ダーク（`browser_emulate_media`）とモバイル幅 390px（`browser_resize`）を確認する。横スクロールが出ていないことは `scrollWidth` と `clientWidth` を比べて確かめる。ヘッドレス Chromium では、ダイアログ背景の `backdrop-blur` がずれて写ることがある。レイアウトが崩れたかどうかは、要素の位置を計測して判断する。

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
- テストファイルは `src/**/*.{test,spec}.{ts,tsx}` のみが対象。`src/__tests__/` に、`src/` と同じ構成で置く（`lib/tasks/`、`app/`、`components/`）。
- tsconfig パスは Vite ネイティブの `resolve.tsconfigPaths: true` で解決している（`vite-tsconfig-paths` プラグインは非推奨のため不使用）。
- `async` な Server Component は Vitest で描画しきれない。同期コンポーネントのみユニットテストし、async コンポーネントは E2E で検証する。ただし、`<Suspense>` の fallback は、`@/lib/supabase/server` の `createClient` を解決しない Promise にモックすれば確認できる（例: `src/__tests__/page.test.tsx`）。
- **進め方はテストファースト**: 先にテストを書き、`npx vitest run <ファイル>` で失敗することを確認してから実装する。
- 操作は `@testing-library/user-event` を使う（`const user = userEvent.setup()`）。`fireEvent` は使わない。
- ドラッグ＆ドロップは jsdom に要素の位置がないため再現できない。`vi.mock("@dnd-kit/react")` で `DragDropProvider` の `onDragEnd` を受け取り、ドロップのイベントを直接送って画面の結果を確かめる（例: `src/__tests__/components/kanban-board-dnd.test.tsx`）。実際のドラッグは Playwright MCP で確認する。ほかのテストは本物の `@dnd-kit/react` のまま描画する。
- 要素は role とアクセシブルな名前で取得する（`getByRole("region", { name: "未着手" })`、`within(...)` で範囲を絞る）。`data-testid` は使わない。
- 非同期の反映は `findBy*` か `vi.waitFor` で待つ。送信中の状態を確かめるときは、解決を手動で制御する Promise をモックに返させる（例: `kanban-board.test.tsx` の「保存中は追加ボタンが無効」）。
- `vi.mock` するモジュールに依存するものは、`vi.mock` の後に `await import(...)` で読み込む。

## 動作確認

- 開発サーバーはユーザーが 3000 番で起動していることが多い。別のサーバーを起動すると Next.js が二重起動を検知して止まるので、起動中なら `curl -s localhost:3000` で HTML を確認する。
- 画面の操作（ボタン押下など）は、ユニットテストとは別に、必要に応じてブラウザで確認する。

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