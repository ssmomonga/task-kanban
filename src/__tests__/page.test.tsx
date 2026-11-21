import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Supabase（外部依存）への問い合わせが終わらない状態を再現する
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => new Promise(() => {}),
}));

const { default: Home } = await import("@/app/page");

describe("Home page", () => {
  test("ページを開くと、見出し「タスクカンバン」が表示される", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "タスクカンバン" }),
    ).toBeInTheDocument();
  });

  test("タスクの取得中は、読み込み中の表示が出る", async () => {
    render(<Home />);
    expect(await screen.findByText("読み込み中…")).toBeInTheDocument();
  });
});
