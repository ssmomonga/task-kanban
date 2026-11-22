import type { Task, TaskStatus } from "./types";

/** タスクをステータスごとに振り分ける。各ステータス内では渡した順番を保つ */
export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) groups[task.status].push(task);
  return groups;
}
