import { createTask, deleteTask, updateTask } from "@/app/actions";
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
      <p role="alert" className="text-red-600 dark:text-red-400">
        タスクの取得に失敗しました。時間をおいて再読み込みしてください。
      </p>
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
