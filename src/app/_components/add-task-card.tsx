import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskForm } from "./task-form";

type Props = {
  /** 成功時は null、失敗時はエラーメッセージを返す */
  onSubmit: (formData: FormData) => Promise<string | null>;
};

/** 新しいタスクを追加するフォームのカード */
export function AddTaskCard({ onSubmit }: Props) {
  return (
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
        <TaskForm label="タスクを追加" submitLabel="追加" pendingLabel="追加中…" onSubmit={onSubmit} />
      </CardContent>
    </Card>
  );
}
