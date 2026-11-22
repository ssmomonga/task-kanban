import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/tasks/types";

type Props = {
  task: Task;
  onEdit: () => void;
  onRequestDelete: () => void;
  /** ドラッグのハンドルにつなぐ ref。渡したときだけハンドルを出す */
  dragHandleRef?: (element: Element | null) => void;
};

/** カードの表示モード。タイトル・説明と、移動（ドラッグ）・編集・削除ボタンを出す */
export function TaskCardView({ task, onEdit, onRequestDelete, dragHandleRef }: Props) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="leading-snug font-medium break-words">{task.title}</h3>
        {task.description && (
          <p className="whitespace-pre-wrap break-words text-muted-foreground">{task.description}</p>
        )}
      </div>
      {/* タッチ端末では常に表示し、マウス操作ではホバー・フォーカス時に強調する */}
      <div className="-mt-0.5 -mr-1 flex shrink-0 gap-0.5 opacity-100 transition-opacity md:opacity-40 md:group-hover/task:opacity-100 md:group-focus-within/task:opacity-100">
        {dragHandleRef && (
          <Button
            ref={dragHandleRef}
            variant="ghost"
            size="icon-sm"
            aria-label="ドラッグして移動"
            title="ドラッグして移動"
            className="cursor-grab touch-none active:cursor-grabbing"
          >
            <GripVertical />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" aria-label="編集" title="編集" onClick={onEdit}>
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
  );
}
