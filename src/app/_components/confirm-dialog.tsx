"use client";

import { useEffect, useId } from "react";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 取り消せない操作の前に表示する確認ダイアログ。表示するときだけ描画する */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
  onCancel,
}: Props) {
  const id = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onCancel]);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-message`}
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg dark:bg-zinc-900"
      >
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={`${id}-message`} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          {/* 誤操作を防ぐため、初期フォーカスはキャンセルに置く */}
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
