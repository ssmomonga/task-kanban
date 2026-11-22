import { describe, expect, it } from "vitest";
import { createAnnouncements } from "@/app/_components/drag-announcements";

const announcements = createAnnouncements((id) => (id === "t1" ? "企画" : ""));

function event(target: string | null, canceled = false) {
  return {
    canceled,
    operation: { source: { id: "t1" }, target: target ? { id: target } : null },
  } as never;
}

describe("createAnnouncements", () => {
  it("持ち上げたとき、カードのタイトルを日本語で読み上げる", () => {
    expect(announcements.dragstart(event(null), undefined as never)).toBe("「企画」を持ち上げました。");
  });

  it("列の上に来たとき、列名を読み上げる", () => {
    expect(announcements.dragover?.(event("done"), undefined as never)).toBe(
      "「企画」が「完了」の列の上にあります。",
    );
  });

  it("列以外の上では、読み上げない", () => {
    expect(announcements.dragover?.(event("unknown"), undefined as never)).toBeUndefined();
  });

  it("列に置いたとき、列名を読み上げる", () => {
    expect(announcements.dragend(event("in_progress"), undefined as never)).toBe(
      "「企画」を「進行中」の列に置きました。",
    );
  });

  it("取り消したとき、取り消したことを読み上げる", () => {
    expect(announcements.dragend(event("done", true), undefined as never)).toBe("「企画」の移動を取り消しました。");
  });
});
