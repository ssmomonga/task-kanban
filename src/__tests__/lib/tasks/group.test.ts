import { describe, expect, it } from "vitest";
import { groupTasksByStatus } from "@/lib/tasks/group";
import type { Task } from "@/lib/tasks/types";

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

describe("groupTasksByStatus", () => {
  it("ステータスの異なるタスクを渡すと、それぞれのステータスに振り分ける", () => {
    const todo = makeTask({ status: "todo" });
    const inProgress = makeTask({ status: "in_progress" });
    const done = makeTask({ status: "done" });

    expect(groupTasksByStatus([done, todo, inProgress])).toEqual({
      todo: [todo],
      in_progress: [inProgress],
      done: [done],
    });
  });

  it("空配列を渡すと、すべてのステータスが空配列になる", () => {
    expect(groupTasksByStatus([])).toEqual({ todo: [], in_progress: [], done: [] });
  });

  it("同じステータスのタスクは、渡した順番を保つ", () => {
    const first = makeTask({ title: "1番目" });
    const second = makeTask({ title: "2番目" });
    const third = makeTask({ title: "3番目" });

    expect(groupTasksByStatus([first, second, third]).todo).toEqual([first, second, third]);
  });
});
