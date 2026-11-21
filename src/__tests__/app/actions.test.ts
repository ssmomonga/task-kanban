import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/tasks/types";

// Supabase（外部依存）のクエリビルダーを模したモック。
// どのメソッドも自分自身を返し、await すると result を返す。
type QueryResult = { data: unknown; error: { code?: string; message: string } | null };
type Call = { method: string; args: unknown[] };

function createQueryMock(result: QueryResult) {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {
    then(
      resolve: (value: QueryResult) => unknown,
      reject: (reason: unknown) => unknown,
    ) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  const record = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
    return builder;
  };
  for (const method of ["insert", "update", "delete", "select", "eq", "single"]) {
    builder[method] = record(method);
  }
  // クライアント自体は thenable にしない（await createClient() で解決されてしまうため）
  const client = { from: record("from") };
  const argsOf = (method: string) => calls.find((c) => c.method === method)?.args;
  return { client, calls, argsOf };
}

const createClientMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

const { createTask, updateTask, deleteTask } = await import("@/app/actions");

const task: Task = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "買い物",
  description: "牛乳",
  status: "todo",
  created_at: "2026-11-21T00:00:00Z",
  updated_at: "2026-11-21T00:00:00Z",
};

function formData(fields: Record<string, string>) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
}

function useQueryResult(result: QueryResult) {
  const mock = createQueryMock(result);
  createClientMock.mockResolvedValue(mock.client);
  return mock;
}

beforeEach(() => {
  createClientMock.mockReset();
});

describe("createTask", () => {
  it("入力が正しいとき、未着手で保存し作成したタスクを返す", async () => {
    const mock = useQueryResult({ data: task, error: null });

    const result = await createTask(formData({ title: " 買い物 ", description: "牛乳" }));

    expect(result).toEqual({ ok: true, data: task });
    expect(mock.argsOf("from")).toEqual(["tasks"]);
    expect(mock.argsOf("insert")).toEqual([
      { title: "買い物", description: "牛乳", status: "todo" },
    ]);
  });

  it("タイトルが空のとき、DB に接続せずエラーを返す", async () => {
    const result = await createTask(formData({ title: "" }));

    expect(result).toEqual({ ok: false, error: "タイトルを入力してください" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("DB がエラーを返したとき、失敗メッセージを返す", async () => {
    useQueryResult({ data: null, error: { message: "network error" } });

    const result = await createTask(formData({ title: "買い物" }));

    expect(result).toEqual({ ok: false, error: "タスクの追加に失敗しました" });
  });
});

describe("updateTask", () => {
  it("入力が正しいとき、対象のタスクを更新し更新後のタスクを返す", async () => {
    const updated: Task = { ...task, title: "掃除", status: "done" };
    const mock = useQueryResult({ data: updated, error: null });

    const result = await updateTask(
      task.id,
      formData({ title: "掃除", description: "", status: "done" }),
    );

    expect(result).toEqual({ ok: true, data: updated });
    expect(mock.argsOf("update")).toEqual([
      { title: "掃除", description: "", status: "done" },
    ]);
    expect(mock.argsOf("eq")).toEqual(["id", task.id]);
  });

  it("ステータスが不正なとき、DB に接続せずエラーを返す", async () => {
    const result = await updateTask(task.id, formData({ title: "t", status: "x" }));

    expect(result).toEqual({ ok: false, error: "ステータスが不正です" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("ID が空のとき、DB に接続せずエラーを返す", async () => {
    const result = await updateTask("", formData({ title: "t" }));

    expect(result).toEqual({ ok: false, error: "タスクが見つかりません" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("対象のタスクが存在しないとき、見つからないエラーを返す", async () => {
    useQueryResult({ data: null, error: { code: "PGRST116", message: "0 rows" } });

    const result = await updateTask(task.id, formData({ title: "t" }));

    expect(result).toEqual({ ok: false, error: "タスクが見つかりません" });
  });

  it("DB がエラーを返したとき、失敗メッセージを返す", async () => {
    useQueryResult({ data: null, error: { message: "network error" } });

    const result = await updateTask(task.id, formData({ title: "t" }));

    expect(result).toEqual({ ok: false, error: "タスクの更新に失敗しました" });
  });
});

describe("deleteTask", () => {
  it("対象のタスクがあるとき、削除して削除した ID を返す", async () => {
    const mock = useQueryResult({ data: [{ id: task.id }], error: null });

    const result = await deleteTask(task.id);

    expect(result).toEqual({ ok: true, data: { id: task.id } });
    expect(mock.calls.some((c) => c.method === "delete")).toBe(true);
    expect(mock.argsOf("eq")).toEqual(["id", task.id]);
  });

  it("ID が空のとき、DB に接続せずエラーを返す", async () => {
    const result = await deleteTask("");

    expect(result).toEqual({ ok: false, error: "タスクが見つかりません" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("対象のタスクが存在しないとき、見つからないエラーを返す", async () => {
    useQueryResult({ data: [], error: null });

    const result = await deleteTask(task.id);

    expect(result).toEqual({ ok: false, error: "タスクが見つかりません" });
  });

  it("DB がエラーを返したとき、失敗メッセージを返す", async () => {
    useQueryResult({ data: null, error: { message: "network error" } });

    const result = await deleteTask(task.id);

    expect(result).toEqual({ ok: false, error: "タスクの削除に失敗しました" });
  });
});
