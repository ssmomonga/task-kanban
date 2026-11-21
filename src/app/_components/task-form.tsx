"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { TASK_STATUSES, type Task } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";

type Props = {
  /** フォームのアクセシブルな名前 */
  label: string;
  /** 編集時は対象のタスク。省略時は新規追加フォームになる */
  task?: Task;
  submitLabel: string;
  pendingLabel: string;
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onSubmit: (formData: FormData) => Promise<string | null>;
  onCancel?: () => void;
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function TaskForm({ label, task, submitLabel, pendingLabel, onSubmit, onCancel }: Props) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const input = validateTaskInput(formData);
    if (!input.ok) {
      setError(input.error);
      return;
    }

    startTransition(async () => {
      const submitError = await onSubmit(formData);
      setError(submitError);
      if (!submitError && !task) form.reset();
    });
  }

  return (
    <form aria-label={label} onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-title`} className="text-sm font-medium">
          タイトル
        </label>
        <input id={`${id}-title`} name="title" defaultValue={task?.title} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-description`} className="text-sm font-medium">
          説明
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          defaultValue={task?.description}
          rows={2}
          className={inputClass}
        />
      </div>
      {task && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-status`} className="text-sm font-medium">
            ステータス
          </label>
          <select id={`${id}-status`} name="status" defaultValue={task.status} className={inputClass}>
            {TASK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
