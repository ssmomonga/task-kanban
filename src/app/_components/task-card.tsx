"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="leading-snug font-medium break-words">{task.title}</h3>
            {task.description && (
              <p className="whitespace-pre-wrap break-words text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>
          {/* タッチ端末では常に表示し、マウス操作ではホバー・フォーカス時に強調する */}
          <div className="-mt-0.5 -mr-1 flex shrink-0 gap-0.5 opacity-100 transition-opacity md:opacity-40 md:group-hover/task:opacity-100 md:group-focus-within/task:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="編集"
              title="編集"
              onClick={() => setIsEditing(true)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="削除"
              title="削除"
              onClick={onRequestDelete}
              className="hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
