import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "@/app/_components/task-card";
import type { Task } from "@/lib/tasks/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: "企画",
    description: "",
    status: "todo",
    created_at: "2026-11-21T00:00:00Z",
    updated_at: "2026-11-21T00:00:00Z",
    ...overrides,
  };
}

function setup(task: Task = makeTask()) {
  const onUpdate = vi.fn<(formData: FormData) => Promise<string | null>>();
  const onRequestDelete = vi.fn<() => void>();
  const user = userEvent.setup();
  render(<TaskCard task={task} onUpdate={onUpdate} onRequestDelete={onRequestDelete} />);
  const card = within(screen.getByRole("article", { name: task.title }));
  return { user, onUpdate, onRequestDelete, card };
}

describe("TaskCard 表示", () => {
  it("説明があるとき、タイトルと説明を表示する", () => {
    const { card } = setup(makeTask({ title: "企画", description: "資料を作る" }));

    expect(card.getByRole("heading", { name: "企画" })).toBeInTheDocument();
    expect(card.getByText("資料を作る")).toBeInTheDocument();
  });

  it("説明が空のとき、タイトルだけを表示する", () => {
    const { card } = setup(makeTask({ title: "企画", description: "" }));

    expect(card.getByRole("heading", { name: "企画" })).toBeInTheDocument();
    expect(card.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});

describe("TaskCard 編集の切り替え", () => {
  it("編集を押すと編集フォームに切り替わり、キャンセルを押すと表示に戻る", async () => {
    const { user, card, onUpdate } = setup();

    await user.click(card.getByRole("button", { name: "編集" }));
    expect(card.getByRole("form", { name: "「企画」を編集" })).toBeInTheDocument();
    expect(card.queryByRole("button", { name: "編集" })).not.toBeInTheDocument();

    await user.click(card.getByRole("button", { name: "キャンセル" }));
    expect(card.queryByRole("form")).not.toBeInTheDocument();
    expect(card.getByRole("button", { name: "編集" })).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("保存して onUpdate が成功を返すと、表示に戻る", async () => {
    const { user, card, onUpdate } = setup();
    onUpdate.mockResolvedValue(null);

    await user.click(card.getByRole("button", { name: "編集" }));
    await user.click(card.getByRole("button", { name: "保存" }));

    await vi.waitFor(() => expect(card.queryByRole("form")).not.toBeInTheDocument());
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it("保存して onUpdate がエラーを返すと、エラーを表示し編集フォームのままにする", async () => {
    const { user, card, onUpdate } = setup();
    onUpdate.mockResolvedValue("タスクの更新に失敗しました");

    await user.click(card.getByRole("button", { name: "編集" }));
    await user.click(card.getByRole("button", { name: "保存" }));

    expect(await card.findByRole("alert")).toHaveTextContent("タスクの更新に失敗しました");
    expect(card.getByRole("form", { name: "「企画」を編集" })).toBeInTheDocument();
  });
});

describe("TaskCard 削除", () => {
  it("削除を押すと、onRequestDelete を呼ぶ", async () => {
    const { user, card, onRequestDelete } = setup();

    await user.click(card.getByRole("button", { name: "削除" }));

    expect(onRequestDelete).toHaveBeenCalledTimes(1);
  });
});
