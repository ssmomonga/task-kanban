import { TASK_STATUSES, type ActionResult, type TaskInput, type TaskStatus } from "./types";

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** DB の char_length と同じく、サロゲートペア（絵文字など）を1文字として数える */
function countChars(value: string): number {
  return Array.from(value).length;
}

function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status.value === value);
}

/** フォーム入力を検証する。ルールは DB の check 制約と揃えている */
export function validateTaskInput(formData: FormData): ActionResult<TaskInput> {
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const status = getString(formData, "status") || "todo";

  if (!title) return { ok: false, error: "タイトルを入力してください" };
  if (countChars(title) > TITLE_MAX_LENGTH) {
    return { ok: false, error: `タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください` };
  }
  if (countChars(description) > DESCRIPTION_MAX_LENGTH) {
    return { ok: false, error: `説明は${DESCRIPTION_MAX_LENGTH}文字以内で入力してください` };
  }
  if (!isTaskStatus(status)) return { ok: false, error: "ステータスが不正です" };

  return { ok: true, data: { title, description, status } };
}
