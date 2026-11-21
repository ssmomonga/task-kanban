"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Task } from "@/lib/tasks/types";
import { validateTaskInput } from "@/lib/tasks/validation";

// 認証は未導入（RLS で anon に全操作を許可している）。
// 認証を入れるときは、ここでユーザーを確認すること。

const NOT_FOUND = "タスクが見つかりません";
// PostgREST の .single() で該当行が0件のときのエラーコード
const NO_ROWS_CODE = "PGRST116";

export async function createTask(formData: FormData): Promise<ActionResult<Task>> {
  const input = validateTaskInput(formData);
  if (!input.ok) return input;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(input.data)
    .select()
    .single();

  if (error || !data) return { ok: false, error: "タスクの追加に失敗しました" };
  return { ok: true, data };
}

export async function updateTask(
  id: string,
  formData: FormData,
): Promise<ActionResult<Task>> {
  if (!id) return { ok: false, error: NOT_FOUND };
  const input = validateTaskInput(formData);
  if (!input.ok) return input;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(input.data)
    .eq("id", id)
    .select()
    .single();

  if (error?.code === NO_ROWS_CODE) return { ok: false, error: NOT_FOUND };
  if (error || !data) return { ok: false, error: "タスクの更新に失敗しました" };
  return { ok: true, data };
}

export async function deleteTask(id: string): Promise<ActionResult<{ id: string }>> {
  if (!id) return { ok: false, error: NOT_FOUND };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || !data) return { ok: false, error: "タスクの削除に失敗しました" };
  if (data.length === 0) return { ok: false, error: NOT_FOUND };
  return { ok: true, data: { id } };
}
