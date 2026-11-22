"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUSES, type Task } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";
import { cn } from "@/lib/utils";
import { FormError } from "./form-error";

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

export function TaskForm({ label, task, submitLabel, pendingLabel, onSubmit, onCancel }: Props) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isCreate = !task;

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
    <form aria-label={label} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className={cn("grid gap-4", isCreate && "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-title`}>タイトル</Label>
          <Input
            id={`${id}-title`}
            name="title"
            defaultValue={task?.title}
            placeholder={isCreate ? "例: 企画書を作成する" : undefined}
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-description`}>説明</Label>
          <Textarea
            id={`${id}-description`}
            name="description"
            defaultValue={task?.description}
            placeholder={isCreate ? "詳細やメモ（任意）" : undefined}
            rows={2}
            className="min-h-8"
          />
        </div>
      </div>
      {task && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-status`}>ステータス</Label>
          <NativeSelect
            id={`${id}-status`}
            name="status"
            defaultValue={task.status}
            className="w-full"
          >
            {TASK_STATUSES.map((status) => (
              <NativeSelectOption key={status.value} value={status.value}>
                {status.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="min-w-20">
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
