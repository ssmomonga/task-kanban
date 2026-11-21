"use client";

import { useState } from "react";
import type { Task } from "@/lib/tasks/types";
import { TaskForm } from "./task-form";

type Props = {
  task: Task;
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onUpdate: (formData: FormData) => Promise<string | null>;
  onRequestDelete: () => void;
};

export function TaskCard({ task, onUpdate, onRequestDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleUpdate(formData: FormData) {
    const error = await onUpdate(formData);
    if (!error) setIsEditing(false);
    return error;
  }

  return (
    <article
      aria-label={task.title}
      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      {isEditing ? (
        <TaskForm
          label={`「${task.title}」を編集`}
          task={task}
          submitLabel="保存"
          pendingLabel="保存中…"
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium break-words">{task.title}</h3>
          {task.description && (
            <p className="whitespace-pre-wrap break-words text-sm text-zinc-600 dark:text-zinc-400">
              {task.description}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-zinc-800"
            >
              編集
            </button>
            <button
              type="button"
              onClick={onRequestDelete}
              className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-800"
            >
              削除
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
