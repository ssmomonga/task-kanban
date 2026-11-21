"use client";

import { useCallback, useState, useTransition } from "react";
import {
  TASK_STATUSES,
  type CreateTaskAction,
  type DeleteTaskAction,
  type Task,
  type UpdateTaskAction,
} from "@/lib/tasks/types";
import { ConfirmDialog } from "./confirm-dialog";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";

type Props = {
  initialTasks: Task[];
  createTask: CreateTaskAction;
  updateTask: UpdateTaskAction;
  deleteTask: DeleteTaskAction;
};

/**
 * カンバン本体。Server Action の戻り値でローカルの一覧を更新し、操作結果をすぐ画面に反映する。
 * アクションは props で受け取る（テストでは差し替える）。
 */
export function KanbanBoard({ initialTasks, createTask, updateTask, deleteTask }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  async function handleCreate(formData: FormData) {
    const result = await createTask(formData);
    if (!result.ok) return result.error;
    setTasks((prev) => [...prev, result.data]);
    return null;
  }

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateTask(id, formData);
    if (!result.ok) return result.error;
    setTasks((prev) => prev.map((task) => (task.id === id ? result.data : task)));
    return null;
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    startDeleteTransition(async () => {
      const result = await deleteTask(id);
      setDeleteTarget(null);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      setTasks((prev) => prev.filter((task) => task.id !== id));
    });
  }

  const handleCancelDelete = useCallback(() => setDeleteTarget(null), []);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 font-semibold">タスクを追加</h2>
        <TaskForm
          label="タスクを追加"
          submitLabel="追加"
          pendingLabel="追加中…"
          onSubmit={handleCreate}
        />
      </section>

      {deleteError && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {deleteError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {TASK_STATUSES.map(({ value, label }) => {
          const columnTasks = tasks.filter((task) => task.status === value);
          return (
            <section
              key={value}
              aria-label={label}
              className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900/50"
            >
              <header className="flex items-center justify-between">
                <h2 className="font-semibold">{label}</h2>
                <span className="text-sm text-zinc-500">{columnTasks.length}件</span>
              </header>
              {columnTasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">タスクはありません</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {columnTasks.map((task) => (
                    <li key={task.id}>
                      <TaskCard
                        task={task}
                        onUpdate={(formData) => handleUpdate(task.id, formData)}
                        onRequestDelete={() => {
                          setDeleteError(null);
                          setDeleteTarget(task);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="タスクを削除しますか？"
          message={`「${deleteTarget.title}」を削除します。この操作は取り消せません。`}
          confirmLabel="削除する"
          pendingLabel="削除中…"
          isPending={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
