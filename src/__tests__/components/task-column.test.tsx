import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TaskColumn } from "@/app/_components/task-column";
import type { Task } from "@/lib/tasks/types";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: "タスク",
    description: "",
    status: "in_progress",
    created_at: "2026-11-21T00:00:00Z",
    updated_at: "2026-11-21T00:00:00Z",
    ...overrides,
  };
}

function renderColumn(tasks: Task[]) {
  render(
    <TaskColumn
      status="in_progress"
      label="進行中"
      tasks={tasks}
      renderTask={(task) => <article aria-label={task.title}>{task.title}</article>}
    />,
  );
  return screen.getByRole("region", { name: "進行中" });
}

describe("TaskColumn", () => {
  it("ラベルを渡すと、その名前の領域と見出しとして表示する", () => {
    const column = renderColumn([]);

    expect(within(column).getByRole("heading", { name: "進行中" })).toBeInTheDocument();
  });

  it("タスクが2件のとき、件数を「2件」と表示し、タスクを渡した順に並べる", () => {
    const column = renderColumn([makeTask({ title: "設計" }), makeTask({ title: "実装" })]);

    expect(within(column).getByText("2件")).toBeInTheDocument();
    const items = within(column).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["設計", "実装"]);
  });

  it("タスクが1件のとき、空であることは表示しない", () => {
    const column = renderColumn([makeTask({ title: "設計" })]);

    expect(within(column).getByText("1件")).toBeInTheDocument();
    expect(within(column).queryByText("タスクはありません")).not.toBeInTheDocument();
  });

  it("タスクが0件のとき、「0件」と空であることを表示し、一覧は出さない", () => {
    const column = renderColumn([]);

    expect(within(column).getByText("0件")).toBeInTheDocument();
    expect(within(column).getByText("タスクはありません")).toBeInTheDocument();
    expect(within(column).queryByRole("list")).not.toBeInTheDocument();
  });
});
