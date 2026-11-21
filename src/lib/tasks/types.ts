import type { Tables } from "@/lib/supabase/database.types";

export type Task = Tables<"tasks">;
export type TaskStatus = Task["status"];

/** 列の並び順と表示名 */
export const TASK_STATUSES: readonly { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "done", label: "完了" },
];

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type TaskInput = Pick<Task, "title" | "description" | "status">;

export type CreateTaskAction = (formData: FormData) => Promise<ActionResult<Task>>;
export type UpdateTaskAction = (
  id: string,
  formData: FormData,
) => Promise<ActionResult<Task>>;
export type DeleteTaskAction = (id: string) => Promise<ActionResult<{ id: string }>>;
