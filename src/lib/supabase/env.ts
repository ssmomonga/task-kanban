export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

/**
 * .env.local の Supabase 接続情報を取得する。
 * NEXT_PUBLIC_ 変数はビルド時にインライン化されるため、process.env.XXX の形で直接参照する。
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase の環境変数が未設定です。.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。",
    );
  }

  return { url, publishableKey };
}
