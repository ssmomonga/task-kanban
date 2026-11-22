import type { Task, TaskStatus } from "./types";

/** 指定したタスクのステータスだけを変えた新しい配列を返す（並び順は保つ） */
export function changeTaskStatus(tasks: Task[], id: string, status: TaskStatus): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, status } : task));
}

/** 既存のタスクから updateTask に渡す FormData を作る。status を渡すとその値で上書きする */
export function toTaskFormData(task: Task, status: TaskStatus = task.status): FormData {
  const formData = new FormData();
  formData.set("title", task.title);
  formData.set("description", task.description);
  formData.set("status", status);
  return formData;
}
