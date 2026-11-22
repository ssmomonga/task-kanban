"use client";

import { useCallback, useState, useTransition } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { groupTasksByStatus } from "@/lib/tasks/group";
import {
  TASK_STATUSES,
  type CreateTaskAction,
  type DeleteTaskAction,
  type Task,
  type UpdateTaskAction,
} from "@/lib/tasks/types";
import { ConfirmDialog } from "./confirm-dialog";
import { TaskCard } from "./task-card";
import { TaskColumn } from "./task-column";
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
  // 閉じるアニメーション中もタイトルを表示し続けるため、最後の削除対象を保持する
  const [lastDeleteTarget, setLastDeleteTarget] = useState<Task | null>(null);
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

  function handleRequestDelete(task: Task) {
    setDeleteError(null);
    setDeleteTarget(task);
    setLastDeleteTarget(task);
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

  const tasksByStatus = groupTasksByStatus(tasks);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Plus className="size-4" aria-hidden="true" />
              </span>
              タスクを追加
            </h2>
          </CardTitle>
          <CardDescription>追加したタスクは「未着手」列に入ります。</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm
            label="タスクを追加"
            submitLabel="追加"
            pendingLabel="追加中…"
            onSubmit={handleCreate}
          />
        </CardContent>
      </Card>

      {deleteError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-4 md:grid-cols-3">
        {TASK_STATUSES.map(({ value, label }) => (
          <TaskColumn
            key={value}
            status={value}
            label={label}
            tasks={tasksByStatus[value]}
            renderTask={(task) => (
              <TaskCard
                task={task}
                onUpdate={(formData) => handleUpdate(task.id, formData)}
                onRequestDelete={() => handleRequestDelete(task)}
              />
            )}
          />
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="タスクを削除しますか？"
        message={`「${lastDeleteTarget?.title ?? ""}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        pendingLabel="削除中…"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
