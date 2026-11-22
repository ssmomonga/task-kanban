import { describe, expect, it } from "vitest";
import { changeTaskStatus, toTaskFormData } from "@/lib/tasks/move";
import type { Task } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: "企画",
    description: "資料を作る",
    status: "todo",
    created_at: "2026-11-21T00:00:00Z",
    updated_at: "2026-11-21T00:00:00Z",
    ...overrides,
  };
}

describe("changeTaskStatus", () => {
  it("指定したタスクだけステータスを変え、ほかのタスクと並び順はそのままにする", () => {
    const first = makeTask({ title: "1番目" });
    const target = makeTask({ title: "2番目" });
    const third = makeTask({ title: "3番目" });

    const result = changeTaskStatus([first, target, third], target.id, "done");

    expect(result).toEqual([first, { ...target, status: "done" }, third]);
  });

  it("存在しない id を渡すと、どのタスクも変えない", () => {
    const tasks = [makeTask(), makeTask()];

    expect(changeTaskStatus(tasks, "unknown", "done")).toEqual(tasks);
  });

  it("元の配列とタスクは書き換えない", () => {
    const target = makeTask({ status: "todo" });
    const tasks = [target];

    changeTaskStatus(tasks, target.id, "in_progress");

    expect(tasks[0].status).toBe("todo");
  });
});

describe("toTaskFormData", () => {
  it("タスクのタイトル・説明・ステータスを FormData にし、検証を通る", () => {
    const formData = toTaskFormData(makeTask({ title: "企画", description: "資料を作る", status: "in_progress" }));

    expect(validateTaskInput(formData)).toEqual({
      ok: true,
      data: { title: "企画", description: "資料を作る", status: "in_progress" },
    });
  });

  it("ステータスを指定すると、そのステータスで FormData を作る", () => {
    const formData = toTaskFormData(makeTask({ status: "todo" }), "done");

    expect(formData.get("status")).toBe("done");
  });
});
