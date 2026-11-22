import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCardView } from "@/app/_components/task-card-view";
import type { Task } from "@/lib/tasks/types";

const task: Task = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "企画",
  description: "資料を作る\n2行目",
  status: "todo",
  created_at: "2026-11-21T00:00:00Z",
  updated_at: "2026-11-21T00:00:00Z",
};

function setup() {
  const onEdit = vi.fn<() => void>();
  const onRequestDelete = vi.fn<() => void>();
  const user = userEvent.setup();
  render(<TaskCardView task={task} onEdit={onEdit} onRequestDelete={onRequestDelete} />);
  return { user, onEdit, onRequestDelete };
}

describe("TaskCardView", () => {
  it("タスクを渡すと、タイトルと改行を含む説明を表示する", () => {
    setup();

    expect(screen.getByRole("heading", { name: "企画" })).toBeInTheDocument();
    expect(screen.getByText(/資料を作る/)).toHaveTextContent("資料を作る 2行目", { normalizeWhitespace: true });
  });

  it("編集を押すと onEdit だけを呼ぶ", async () => {
    const { user, onEdit, onRequestDelete } = setup();

    await user.click(screen.getByRole("button", { name: "編集" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onRequestDelete).not.toHaveBeenCalled();
  });

  it("削除を押すと onRequestDelete だけを呼ぶ", async () => {
    const { user, onEdit, onRequestDelete } = setup();

    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(onRequestDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });
});
