import { TASK_STATUSES, type Task, type TaskStatus } from "./types";

/** タスクをステータスごとに振り分ける。各ステータス内では渡した順番を保つ */
export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  // ステータスの一覧は TASK_STATUSES を唯一の定義元にする
  const groups = Object.fromEntries(
    TASK_STATUSES.map(({ value }) => [value, [] as Task[]]),
  ) as Record<TaskStatus, Task[]>;
  for (const task of tasks) groups[task.status].push(task);
  return groups;
}
