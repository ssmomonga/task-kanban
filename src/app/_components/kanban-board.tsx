"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { groupTasksByStatus } from "@/lib/tasks/group";
import { changeTaskStatus, toTaskFormData } from "@/lib/tasks/move";
import {
  TASK_STATUSES,
  type CreateTaskAction,
  type DeleteTaskAction,
  type Task,
  type TaskStatus,
  type UpdateTaskAction,
} from "@/lib/tasks/types";
import { isTaskStatus } from "@/lib/tasks/validation";
import { AddTaskCard } from "./add-task-card";
import { ConfirmDialog } from "./confirm-dialog";
import { TaskCard } from "./task-card";
import { TaskColumn } from "./task-column";

type Props = {
  initialTasks: Task[];
  createTask: CreateTaskAction;
  updateTask: UpdateTaskAction;
  deleteTask: DeleteTaskAction;
};

/**
 * カンバン本体。Server Action の戻り値でローカルの一覧を更新し、操作結果をすぐ画面に反映する。
 * ドラッグ＆ドロップでの移動だけは、保存を待たずに先に移動し、失敗したら元の列に戻す。
 * アクションは props で受け取る（テストでは差し替える）。
 */
export function KanbanBoard({ initialTasks, createTask, updateTask, deleteTask }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  // 閉じるアニメーション中もタイトルを表示し続けるため、最後の削除対象を保持する
  const [lastDeleteTarget, setLastDeleteTarget] = useState<Task | null>(null);
  // 削除・移動の失敗など、特定のフォームに属さないエラー
  const [boardError, setBoardError] = useState<string | null>(null);
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

  async function handleMove(id: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;

    setBoardError(null);
    setTasks((prev) => changeTaskStatus(prev, id, status));
    const result = await updateTask(id, toTaskFormData(task, status));
    if (!result.ok) {
      setTasks((prev) => changeTaskStatus(prev, id, task.status));
      setBoardError(result.error);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? result.data : t)));
  }

  function handleRequestDelete(task: Task) {
    setBoardError(null);
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
        setBoardError(result.error);
        return;
      }
      setTasks((prev) => prev.filter((task) => task.id !== id));
    });
  }

  const handleCancelDelete = useCallback(() => setDeleteTarget(null), []);

  const tasksByStatus = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  return (
    <div className="flex flex-col gap-6">
      <AddTaskCard onSubmit={handleCreate} />

      {boardError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{boardError}</AlertDescription>
        </Alert>
      )}

      <DragDropProvider
        onDragEnd={(event) => {
          const { source, target } = event.operation;
          if (event.canceled || !source || !target) return;
          const status = String(target.id);
          if (!isTaskStatus(status)) return;
          void handleMove(String(source.id), status);
        }}
      >
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
      </DragDropProvider>

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
