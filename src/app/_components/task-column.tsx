import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskStatus } from "@/lib/tasks/types";

/** 列ごとのアクセント色（見出しのドットと上端のライン） */
const STATUS_ACCENTS: Record<TaskStatus, { dot: string; bar: string }> = {
  todo: { dot: "bg-slate-400 dark:bg-slate-500", bar: "bg-slate-400/70 dark:bg-slate-500/70" },
  in_progress: { dot: "bg-amber-500 dark:bg-amber-400", bar: "bg-amber-500/70 dark:bg-amber-400/70" },
  done: { dot: "bg-emerald-500 dark:bg-emerald-400", bar: "bg-emerald-500/70 dark:bg-emerald-400/70" },
};

type Props = {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  /** 各タスクのカードを描画する（`<li>` は列側で付ける） */
  renderTask: (task: Task) => ReactNode;
};

/** カンバンの1列。見出し・件数と、タスク一覧（0件なら空の表示）を出す */
export function TaskColumn({ status, label, tasks, renderTask }: Props) {
  const accent = STATUS_ACCENTS[status];
  return (
    <section
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
          {tasks.length}件
        </Badge>
      </header>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-foreground/15 px-4 py-8 text-muted-foreground">
          <Inbox className="size-5" aria-hidden="true" />
          <p className="text-sm">タスクはありません</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>{renderTask(task)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
