import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkSupabaseConnection } from "@/lib/supabase/check-connection";

const url = "https://example.supabase.co";
const key = "sb_publishable_test";

describe("checkSupabaseConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("ヘルスチェックが 200 を返すと接続成功になる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkSupabaseConnection()).resolves.toEqual({ ok: true, url });
    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toBe(`${url}/auth/v1/health`);
    expect(init.headers).toEqual({ apikey: key });
  });

  it("キーが不正で 401 が返ると接続失敗になりステータスを含む", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));

    const result = await checkSupabaseConnection();
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toContain("HTTP 401");
  });

  it("ネットワークエラー時は接続失敗になる", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await checkSupabaseConnection();
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toContain("fetch failed");
  });

  it.each([
    ["URL", "NEXT_PUBLIC_SUPABASE_URL"],
    ["キー", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  ])("%s が空文字のときは通信せず接続失敗になる", async (_, name) => {
    vi.stubEnv(name, "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();
    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toContain("環境変数が未設定");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
