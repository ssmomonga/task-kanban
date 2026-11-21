import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/app/_components/kanban-board";
import type { ActionResult, Task } from "@/lib/tasks/types";

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

function setup(initialTasks: Task[] = []) {
  const actions = {
    createTask: vi.fn<(formData: FormData) => Promise<ActionResult<Task>>>(),
    updateTask: vi.fn<(id: string, formData: FormData) => Promise<ActionResult<Task>>>(),
    deleteTask: vi.fn<(id: string) => Promise<ActionResult<{ id: string }>>>(),
  };
  const user = userEvent.setup();
  render(<KanbanBoard initialTasks={initialTasks} {...actions} />);
  return { user, ...actions };
}

const column = (name: string) => screen.getByRole("region", { name });
const card = (title: string) => screen.getByRole("article", { name: title });
const addForm = () => screen.getByRole("form", { name: "タスクを追加" });

describe("KanbanBoard 一覧表示", () => {
  it("タスクがあるとき、ステータスごとの列に振り分けて表示する", () => {
    setup([
      makeTask({ title: "企画", status: "todo" }),
      makeTask({ title: "実装", status: "in_progress" }),
      makeTask({ title: "調査", status: "done" }),
    ]);

    expect(within(column("未着手")).getByRole("article", { name: "企画" })).toBeInTheDocument();
    expect(within(column("進行中")).getByRole("article", { name: "実装" })).toBeInTheDocument();
    expect(within(column("完了")).getByRole("article", { name: "調査" })).toBeInTheDocument();
  });

  it("タスクがない列には、空であることを表示する", () => {
    setup([makeTask({ title: "企画", status: "todo" })]);

    expect(within(column("未着手")).queryByText("タスクはありません")).not.toBeInTheDocument();
    expect(within(column("進行中")).getByText("タスクはありません")).toBeInTheDocument();
    expect(within(column("完了")).getByText("タスクはありません")).toBeInTheDocument();
  });

  it("タスクの説明があるとき、カードに表示する", () => {
    setup([makeTask({ title: "企画", description: "資料を作る" })]);

    expect(within(card("企画")).getByText("資料を作る")).toBeInTheDocument();
  });
});

describe("KanbanBoard タスク追加", () => {
  it("タイトルを入力して追加すると、未着手列にすぐ表示されフォームが空になる", async () => {
    const { user, createTask } = setup();
    createTask.mockImplementation(async (formData) => ({
      ok: true,
      data: makeTask({ title: String(formData.get("title")), description: "牛乳" }),
    }));

    const form = within(addForm());
    await user.type(form.getByLabelText("タイトル"), "買い物");
    await user.type(form.getByLabelText("説明"), "牛乳");
    await user.click(form.getByRole("button", { name: "追加" }));

    expect(await within(column("未着手")).findByRole("article", { name: "買い物" })).toBeInTheDocument();
    expect(createTask).toHaveBeenCalledTimes(1);
    expect(form.getByLabelText("タイトル")).toHaveValue("");
    expect(form.getByLabelText("説明")).toHaveValue("");
  });

  it("タイトルが空白だけのとき、追加せずエラーを表示する", async () => {
    const { user, createTask } = setup();

    const form = within(addForm());
    await user.type(form.getByLabelText("タイトル"), "   ");
    await user.click(form.getByRole("button", { name: "追加" }));

    expect(form.getByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(createTask).not.toHaveBeenCalled();
  });

  it("保存に失敗したとき、エラーを表示し一覧と入力内容はそのまま残る", async () => {
    const { user, createTask } = setup();
    createTask.mockResolvedValue({ ok: false, error: "タスクの追加に失敗しました" });

    const form = within(addForm());
    await user.type(form.getByLabelText("タイトル"), "買い物");
    await user.click(form.getByRole("button", { name: "追加" }));

    expect(await form.findByRole("alert")).toHaveTextContent("タスクの追加に失敗しました");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(form.getByLabelText("タイトル")).toHaveValue("買い物");
  });

  it("保存中は追加ボタンが無効になり、完了すると有効に戻る", async () => {
    const { user, createTask } = setup();
    let resolve: (value: ActionResult<Task>) => void = () => {};
    createTask.mockReturnValue(new Promise((r) => (resolve = r)));

    const form = within(addForm());
    await user.type(form.getByLabelText("タイトル"), "買い物");
    await user.click(form.getByRole("button", { name: "追加" }));

    expect(form.getByRole("button", { name: "追加中…" })).toBeDisabled();
    resolve({ ok: true, data: makeTask({ title: "買い物" }) });
    expect(await form.findByRole("button", { name: "追加" })).toBeEnabled();
  });
});

describe("KanbanBoard タスク編集", () => {
  it("編集を押すと、現在の値が入った編集フォームに切り替わる", async () => {
    const { user } = setup([makeTask({ title: "企画", description: "資料", status: "in_progress" })]);

    await user.click(within(card("企画")).getByRole("button", { name: "編集" }));

    const form = within(card("企画"));
    expect(form.getByLabelText("タイトル")).toHaveValue("企画");
    expect(form.getByLabelText("説明")).toHaveValue("資料");
    expect(form.getByLabelText("ステータス")).toHaveValue("in_progress");
  });

  it("内容を変えて保存すると、すぐ一覧に反映され表示に戻る", async () => {
    const original = makeTask({ title: "企画" });
    const { user, updateTask } = setup([original]);
    updateTask.mockImplementation(async (id, formData) => ({
      ok: true,
      data: { ...original, id, title: String(formData.get("title")) },
    }));

    await user.click(within(card("企画")).getByRole("button", { name: "編集" }));
    const form = within(card("企画"));
    await user.clear(form.getByLabelText("タイトル"));
    await user.type(form.getByLabelText("タイトル"), "企画書");
    await user.click(form.getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("article", { name: "企画書" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "企画" })).not.toBeInTheDocument();
    expect(within(card("企画書")).queryByLabelText("タイトル")).not.toBeInTheDocument();
    expect(updateTask).toHaveBeenCalledWith(original.id, expect.any(FormData));
  });

  it("ステータスを変えて保存すると、タスクが別の列へ移動する", async () => {
    const original = makeTask({ title: "企画", status: "todo" });
    const { user, updateTask } = setup([original]);
    updateTask.mockResolvedValue({ ok: true, data: { ...original, status: "done" } });

    await user.click(within(card("企画")).getByRole("button", { name: "編集" }));
    await user.selectOptions(within(card("企画")).getByLabelText("ステータス"), "完了");
    await user.click(within(card("企画")).getByRole("button", { name: "保存" }));

    expect(await within(column("完了")).findByRole("article", { name: "企画" })).toBeInTheDocument();
    expect(within(column("未着手")).queryByRole("article", { name: "企画" })).not.toBeInTheDocument();
  });

  it("キャンセルを押すと、保存せず元の表示に戻る", async () => {
    const { user, updateTask } = setup([makeTask({ title: "企画" })]);

    await user.click(within(card("企画")).getByRole("button", { name: "編集" }));
    await user.type(within(card("企画")).getByLabelText("タイトル"), "変更");
    await user.click(within(card("企画")).getByRole("button", { name: "キャンセル" }));

    expect(within(card("企画")).queryByLabelText("タイトル")).not.toBeInTheDocument();
    expect(within(card("企画")).getByRole("button", { name: "編集" })).toBeInTheDocument();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("タイトルを空にして保存すると、更新せずエラーを表示する", async () => {
    const { user, updateTask } = setup([makeTask({ title: "企画" })]);

    await user.click(within(card("企画")).getByRole("button", { name: "編集" }));
    await user.clear(within(card("企画")).getByLabelText("タイトル"));
    await user.click(within(card("企画")).getByRole("button", { name: "保存" }));

    expect(within(card("企画")).getByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("保存に失敗したとき、エラーを表示し編集フォームを開いたままにする", async () => {
    const { user, updateTask } = setup([makeTask({ title: "企画" })]);
    updateTask.mockResolvedValue({ ok: false, error: "タスクの更新に失敗しました" });

    await user.click(within(card("企画")).getByRole("button", { name: "編集" }));
    await user.click(within(card("企画")).getByRole("button", { name: "保存" }));

    expect(await within(card("企画")).findByRole("alert")).toHaveTextContent("タスクの更新に失敗しました");
    expect(within(card("企画")).getByLabelText("タイトル")).toBeInTheDocument();
  });
});

describe("KanbanBoard タスク削除", () => {
  it("削除を押すと、タスク名を含む確認ダイアログを表示し、まだ削除しない", async () => {
    const { user, deleteTask } = setup([makeTask({ title: "企画" })]);

    await user.click(within(card("企画")).getByRole("button", { name: "削除" }));

    const dialog = screen.getByRole("alertdialog", { name: "タスクを削除しますか？" });
    expect(dialog).toHaveTextContent("「企画」を削除します");
    expect(deleteTask).not.toHaveBeenCalled();
  });

  it("確認ダイアログでキャンセルすると、ダイアログが閉じタスクは残る", async () => {
    const { user, deleteTask } = setup([makeTask({ title: "企画" })]);

    await user.click(within(card("企画")).getByRole("button", { name: "削除" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "キャンセル" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(card("企画")).toBeInTheDocument();
    expect(deleteTask).not.toHaveBeenCalled();
  });

  it("確認ダイアログで Esc キーを押すと、ダイアログが閉じタスクは残る", async () => {
    const { user, deleteTask } = setup([makeTask({ title: "企画" })]);

    await user.click(within(card("企画")).getByRole("button", { name: "削除" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(card("企画")).toBeInTheDocument();
    expect(deleteTask).not.toHaveBeenCalled();
  });

  it("確認ダイアログで削除を確定すると、タスクがすぐ一覧から消える", async () => {
    const target = makeTask({ title: "企画" });
    const { user, deleteTask } = setup([target, makeTask({ title: "実装" })]);
    deleteTask.mockResolvedValue({ ok: true, data: { id: target.id } });

    await user.click(within(card("企画")).getByRole("button", { name: "削除" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }));

    await vi.waitFor(() =>
      expect(screen.queryByRole("article", { name: "企画" })).not.toBeInTheDocument(),
    );
    expect(card("実装")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteTask).toHaveBeenCalledWith(target.id);
  });

  it("削除に失敗したとき、エラーを表示しタスクは残る", async () => {
    const { user, deleteTask } = setup([makeTask({ title: "企画" })]);
    deleteTask.mockResolvedValue({ ok: false, error: "タスクの削除に失敗しました" });

    await user.click(within(card("企画")).getByRole("button", { name: "削除" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }));

    expect(await screen.findByText("タスクの削除に失敗しました")).toBeInTheDocument();
    expect(card("企画")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
