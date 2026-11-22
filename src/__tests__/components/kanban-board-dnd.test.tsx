import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActionResult, Task, TaskStatus } from "@/lib/tasks/types";

type DragEndEvent = {
  canceled: boolean;
  operation: { source: { id: string } | null; target: { id: string } | null };
};

// ドラッグ操作（外部ライブラリ）は jsdom で再現できないため、ドロップ時のイベントを直接送れるようにする
const dnd = vi.hoisted(() => ({
  onDragEnd: undefined as ((event: DragEndEvent) => void) | undefined,
}));

vi.mock("@dnd-kit/react", () => ({
  DragDropProvider: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd?: (event: DragEndEvent) => void;
  }) => {
    dnd.onDragEnd = onDragEnd;
    return children;
  },
  useDraggable: () => ({ ref: () => {}, handleRef: () => {}, isDragging: false }),
  useDroppable: () => ({ ref: () => {}, isDropTarget: false }),
}));

const { KanbanBoard } = await import("@/app/_components/kanban-board");

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: "タスク",
    description: "",
    status: "todo",
    created_at: "2026-11-21T00:00:00Z",
    updated_at: "2026-11-21T00:00:00Z",
    ...overrides,
  };
}

function setup(initialTasks: Task[]) {
  const actions = {
    createTask: vi.fn<(formData: FormData) => Promise<ActionResult<Task>>>(),
    updateTask: vi.fn<(id: string, formData: FormData) => Promise<ActionResult<Task>>>(),
    deleteTask: vi.fn<(id: string) => Promise<ActionResult<{ id: string }>>>(),
  };
  const user = userEvent.setup();
  render(<KanbanBoard initialTasks={initialTasks} {...actions} />);
  return { user, ...actions };
}

function drop(taskId: string, status: TaskStatus | null, { canceled = false } = {}) {
  act(() => {
    dnd.onDragEnd?.({
      canceled,
      operation: { source: { id: taskId }, target: status ? { id: status } : null },
    });
  });
}

const column = (name: string) => screen.getByRole("region", { name });
const card = (title: string) => screen.getByRole("article", { name: title });

describe("KanbanBoard ドラッグ＆ドロップ", () => {
  it("各カードに、ドラッグで移動するためのハンドルがある", () => {
    setup([makeTask({ title: "企画" })]);

    expect(within(card("企画")).getByRole("button", { name: "ドラッグして移動" })).toBeInTheDocument();
  });

  it("編集中のカードには、ドラッグのハンドルを出さない", async () => {
    const { user } = setup([makeTask({ title: "企画" })]);

    await user.click(within(card("企画")).getByRole("button", { name: "編集" }));

    expect(within(card("企画")).queryByRole("button", { name: "ドラッグして移動" })).not.toBeInTheDocument();
  });

  it("別の列にドロップすると、保存の完了を待たずにその列へ移動し、新しいステータスで保存する", async () => {
    const task = makeTask({ title: "企画", description: "資料", status: "todo" });
    const { updateTask } = setup([task]);
    let resolve: (value: ActionResult<Task>) => void = () => {};
    updateTask.mockReturnValue(new Promise((r) => (resolve = r)));

    drop(task.id, "done");

    expect(within(column("完了")).getByRole("article", { name: "企画" })).toBeInTheDocument();
    expect(within(column("未着手")).queryByRole("article", { name: "企画" })).not.toBeInTheDocument();
    expect(updateTask).toHaveBeenCalledTimes(1);
    const [id, formData] = updateTask.mock.calls[0];
    expect(id).toBe(task.id);
    expect(Object.fromEntries(formData)).toEqual({ title: "企画", description: "資料", status: "done" });

    await act(async () => resolve({ ok: true, data: { ...task, status: "done" } }));
    expect(within(column("完了")).getByRole("article", { name: "企画" })).toBeInTheDocument();
  });

  it("保存に失敗すると、元の列に戻りエラーを表示する", async () => {
    const task = makeTask({ title: "企画", status: "in_progress" });
    const { updateTask } = setup([task, makeTask({ title: "調査", status: "done" })]);
    updateTask.mockResolvedValue({ ok: false, error: "タスクの更新に失敗しました" });

    drop(task.id, "done");

    expect(await screen.findByText("タスクの更新に失敗しました")).toBeInTheDocument();
    expect(within(column("進行中")).getByRole("article", { name: "企画" })).toBeInTheDocument();
    expect(within(column("完了")).queryByRole("article", { name: "企画" })).not.toBeInTheDocument();
    expect(within(column("完了")).getByRole("article", { name: "調査" })).toBeInTheDocument();
  });

  it("移動に失敗したあとで別のタスクの移動に成功すると、エラーが消える", async () => {
    const first = makeTask({ title: "企画" });
    const second = makeTask({ title: "調査" });
    const { updateTask } = setup([first, second]);
    updateTask.mockResolvedValueOnce({ ok: false, error: "タスクの更新に失敗しました" });
    updateTask.mockResolvedValueOnce({ ok: true, data: { ...second, status: "done" } });

    drop(first.id, "done");
    expect(await screen.findByText("タスクの更新に失敗しました")).toBeInTheDocument();

    drop(second.id, "done");
    await vi.waitFor(() =>
      expect(screen.queryByText("タスクの更新に失敗しました")).not.toBeInTheDocument(),
    );
    expect(within(column("完了")).getByRole("article", { name: "調査" })).toBeInTheDocument();
  });

  it("同じ列にドロップすると、保存しない", () => {
    const task = makeTask({ title: "企画", status: "todo" });
    const { updateTask } = setup([task]);

    drop(task.id, "todo");

    expect(within(column("未着手")).getByRole("article", { name: "企画" })).toBeInTheDocument();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("列の外にドロップすると、移動も保存もしない", () => {
    const task = makeTask({ title: "企画", status: "todo" });
    const { updateTask } = setup([task]);

    drop(task.id, null);

    expect(within(column("未着手")).getByRole("article", { name: "企画" })).toBeInTheDocument();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("ドラッグを取り消す（Esc）と、移動も保存もしない", () => {
    const task = makeTask({ title: "企画", status: "todo" });
    const { updateTask } = setup([task]);

    drop(task.id, "done", { canceled: true });

    expect(within(column("未着手")).getByRole("article", { name: "企画" })).toBeInTheDocument();
    expect(updateTask).not.toHaveBeenCalled();
  });
});
