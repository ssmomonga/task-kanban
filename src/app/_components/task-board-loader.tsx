import { CircleAlert } from "lucide-react";
import { createTask, deleteTask, updateTask } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "./kanban-board";

/** タスク一覧を取得してカンバンを描画する。リクエストごとに最新を取得する（動的） */
export async function TaskBoardLoader() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>タスクの取得に失敗しました。</AlertTitle>
        <AlertDescription>時間をおいて再読み込みしてください。</AlertDescription>
      </Alert>
    );
  }

  return (
    <KanbanBoard
      initialTasks={data}
      createTask={createTask}
      updateTask={updateTask}
      deleteTask={deleteTask}
    />
  );
}
