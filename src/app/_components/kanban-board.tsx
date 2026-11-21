"use client";

import { useCallback, useState, useTransition } from "react";
import { CircleAlert, Inbox, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TASK_STATUSES,
  type CreateTaskAction,
  type DeleteTaskAction,
  type Task,
  type TaskStatus,
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

/** 列ごとのアクセント色（見出しのドットと上端のライン） */
const STATUS_ACCENTS: Record<TaskStatus, { dot: string; bar: string }> = {
  todo: { dot: "bg-slate-400 dark:bg-slate-500", bar: "bg-slate-400/70 dark:bg-slate-500/70" },
  in_progress: { dot: "bg-amber-500 dark:bg-amber-400", bar: "bg-amber-500/70 dark:bg-amber-400/70" },
  done: { dot: "bg-emerald-500 dark:bg-emerald-400", bar: "bg-emerald-500/70 dark:bg-emerald-400/70" },
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
        {TASK_STATUSES.map(({ value, label }) => {
          const columnTasks = tasks.filter((task) => task.status === value);
          const accent = STATUS_ACCENTS[value];
          return (
            <section
              key={value}
              aria-label={label}
              className="relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-muted/60 p-3 ring-1 ring-foreground/5 dark:bg-muted/30"
            >
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />
              <header className="flex items-center justify-between px-1 pt-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden="true" className={`size-2 rounded-full ${accent.dot}`} />
                  {label}
                </h2>
                <Badge variant="secondary" className="bg-background/80 tabular-nums dark:bg-background/40">
                  {columnTasks.length}件
                </Badge>
              </header>
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-foreground/15 px-4 py-8 text-muted-foreground">
                  <Inbox className="size-5" aria-hidden="true" />
                  <p className="text-sm">タスクはありません</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {columnTasks.map((task) => (
                    <li key={task.id}>
                      <TaskCard
                        task={task}
                        onUpdate={(formData) => handleUpdate(task.id, formData)}
                        onRequestDelete={() => handleRequestDelete(task)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
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
