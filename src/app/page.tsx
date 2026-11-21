import { Suspense } from "react";
import { KanbanSquare, LoaderCircle } from "lucide-react";
import { TaskBoardLoader } from "./_components/task-board-loader";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-muted/70 via-background to-background">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:py-12">
        <header className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <KanbanSquare className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-semibold tracking-tight">タスクカンバン</h1>
            <p className="text-sm text-muted-foreground">タスクをステータスごとに整理して進めましょう</p>
          </div>
        </header>
        <Suspense
          fallback={
            <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              <span>読み込み中…</span>
            </p>
          }
        >
          <TaskBoardLoader />
        </Suspense>
      </main>
    </div>
  );
}
