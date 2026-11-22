"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/react";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { TaskCardView } from "./task-card-view";
import { TaskForm } from "./task-form";

type Props = {
  task: Task;
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onUpdate: (formData: FormData) => Promise<string | null>;
  onRequestDelete: () => void;
};

/** タスクのカード。表示モードと編集フォームを切り替える。表示モードではハンドルでドラッグできる */
export function TaskCard({ task, onUpdate, onRequestDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  // 編集中はフォームの操作と競合しないようにドラッグを止める
  const { ref, handleRef, isDragging } = useDraggable({ id: task.id, disabled: isEditing });

  async function handleUpdate(formData: FormData) {
    const error = await onUpdate(formData);
    if (!error) setIsEditing(false);
    return error;
  }

  return (
    <article
      // ハンドルがない編集中に要素をつなぐと、dnd-kit が article に role="button" などを付けてしまうため外す
      ref={isEditing ? undefined : ref}
      aria-label={task.title}
      data-slot="card"
      className={cn(
        "group/task rounded-xl bg-card p-3 text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 transition-shadow hover:shadow-md hover:ring-foreground/20 has-focus-visible:ring-foreground/20",
        isDragging && "shadow-md ring-foreground/20",
      )}
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
          dragHandleRef={handleRef}
        />
      )}
    </article>
  );
}
