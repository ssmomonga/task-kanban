"use client";

import { useState } from "react";
import type { Task } from "@/lib/tasks/types";
import { TaskCardView } from "./task-card-view";
import { TaskForm } from "./task-form";

type Props = {
  task: Task;
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onUpdate: (formData: FormData) => Promise<string | null>;
  onRequestDelete: () => void;
};

/** タスクのカード。表示モードと編集フォームを切り替える */
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
      data-slot="card"
      className="group/task rounded-xl bg-card p-3 text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 transition-shadow hover:shadow-md hover:ring-foreground/20 has-focus-visible:ring-foreground/20"
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
        <TaskCardView
          task={task}
          onEdit={() => setIsEditing(true)}
          onRequestDelete={onRequestDelete}
        />
      )}
    </article>
  );
}
