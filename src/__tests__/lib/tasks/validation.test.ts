import { describe, expect, it } from "vitest";
import { validateTaskInput } from "@/lib/tasks/validation";

function formData(fields: Record<string, string>) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("validateTaskInput", () => {
  it("タイトル・説明・ステータスが正しいとき、入力値を返す", () => {
    const result = validateTaskInput(
      formData({ title: "買い物", description: "牛乳", status: "in_progress" }),
    );
    expect(result).toEqual({
      ok: true,
      data: { title: "買い物", description: "牛乳", status: "in_progress" },
    });
  });

  it("ステータスと説明が省略されたとき、未着手・空の説明になる", () => {
    const result = validateTaskInput(formData({ title: "買い物" }));
    expect(result).toEqual({
      ok: true,
      data: { title: "買い物", description: "", status: "todo" },
    });
  });

  it("タイトルと説明の前後の空白は取り除かれる", () => {
    const result = validateTaskInput(
      formData({ title: "  買い物  ", description: "\n牛乳 " }),
    );
    expect(result.ok && result.data).toMatchObject({
      title: "買い物",
      description: "牛乳",
    });
  });

  it.each([
    ["空文字", ""],
    ["空白のみ", "   "],
  ])("タイトルが%sのとき、必須エラーになる", (_, title) => {
    expect(validateTaskInput(formData({ title }))).toEqual({
      ok: false,
      error: "タイトルを入力してください",
    });
  });

  it("タイトルの項目自体がないとき、必須エラーになる", () => {
    expect(validateTaskInput(new FormData())).toEqual({
      ok: false,
      error: "タイトルを入力してください",
    });
  });

  it("タイトルが100文字ちょうどのとき、有効になる", () => {
    expect(validateTaskInput(formData({ title: "あ".repeat(100) })).ok).toBe(
      true,
    );
  });

  it("タイトルが101文字のとき、文字数エラーになる", () => {
    expect(validateTaskInput(formData({ title: "あ".repeat(101) }))).toEqual({
      ok: false,
      error: "タイトルは100文字以内で入力してください",
    });
  });

  it("説明が1000文字ちょうどのとき、有効になる", () => {
    const result = validateTaskInput(
      formData({ title: "t", description: "あ".repeat(1000) }),
    );
    expect(result.ok).toBe(true);
  });

  it("説明が1001文字のとき、文字数エラーになる", () => {
    const result = validateTaskInput(
      formData({ title: "t", description: "あ".repeat(1001) }),
    );
    expect(result).toEqual({
      ok: false,
      error: "説明は1000文字以内で入力してください",
    });
  });

  it("ステータスが定義外の値のとき、ステータスエラーになる", () => {
    const result = validateTaskInput(
      formData({ title: "t", status: "archived" }),
    );
    expect(result).toEqual({ ok: false, error: "ステータスが不正です" });
  });
});
