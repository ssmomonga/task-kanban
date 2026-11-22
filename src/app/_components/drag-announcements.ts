import type { Accessibility } from "@dnd-kit/dom";
import { TASK_STATUSES } from "@/lib/tasks/types";
import { isTaskStatus } from "@/lib/tasks/validation";

type Announcements = NonNullable<
  NonNullable<ConstructorParameters<typeof Accessibility>[1]>["announcements"]
>;

type DragEvent = {
  operation: { source: { id: unknown } | null; target: { id: unknown } | null };
};

/** スクリーンリーダー向けの操作説明（dnd-kit の既定は英語のため日本語にする） */
export const screenReaderInstructions = {
  draggable:
    "Space キーでカードを持ち上げます。矢印キーで移動先の列を選び、Space キーで置きます。Esc キーで取り消します。",
};

function columnLabel(target: { id: unknown } | null): string | null {
  const id = target ? String(target.id) : "";
  if (!isTaskStatus(id)) return null;
  return TASK_STATUSES.find((s) => s.value === id)?.label ?? null;
}

/** ドラッグ中のスクリーンリーダー向け読み上げ。タイトルは getTitle で引く */
export function createAnnouncements(getTitle: (id: string) => string): Announcements {
  const titleOf = (event: DragEvent) => {
    const id = event.operation.source ? String(event.operation.source.id) : "";
    return `「${getTitle(id)}」`;
  };
  return {
    dragstart: (event) => `${titleOf(event)}を持ち上げました。`,
    dragover: (event) => {
      const label = columnLabel(event.operation.target);
      return label ? `${titleOf(event)}が「${label}」の列の上にあります。` : undefined;
    },
    dragend: (event) => {
      if (event.canceled) return `${titleOf(event)}の移動を取り消しました。`;
      const label = columnLabel(event.operation.target);
      return label
        ? `${titleOf(event)}を「${label}」の列に置きました。`
        : `${titleOf(event)}を元の場所に置きました。`;
    },
  };
}
