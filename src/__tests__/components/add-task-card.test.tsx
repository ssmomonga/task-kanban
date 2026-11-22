import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTaskCard } from "@/app/_components/add-task-card";

function setup() {
  const onSubmit = vi.fn<(formData: FormData) => Promise<string | null>>();
  const user = userEvent.setup();
  render(<AddTaskCard onSubmit={onSubmit} />);
  const form = within(screen.getByRole("form", { name: "タスクを追加" }));
  return { user, onSubmit, form };
}

describe("AddTaskCard", () => {
  it("表示すると、見出し「タスクを追加」と追加先の説明を表示する", () => {
    setup();

    expect(screen.getByRole("heading", { level: 2, name: "タスクを追加" })).toBeInTheDocument();
    expect(screen.getByText("追加したタスクは「未着手」列に入ります。")).toBeInTheDocument();
  });

  it("タイトルを入力して追加すると、入力内容を onSubmit に渡しフォームを空にする", async () => {
    const { user, onSubmit, form } = setup();
    onSubmit.mockResolvedValue(null);

    await user.type(form.getByLabelText("タイトル"), "買い物");
    await user.click(form.getByRole("button", { name: "追加" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].get("title")).toBe("買い物");
    await vi.waitFor(() => expect(form.getByLabelText("タイトル")).toHaveValue(""));
  });

  it("onSubmit がエラーを返したとき、エラーを表示し入力内容を残す", async () => {
    const { user, onSubmit, form } = setup();
    onSubmit.mockResolvedValue("タスクの追加に失敗しました");

    await user.type(form.getByLabelText("タイトル"), "買い物");
    await user.click(form.getByRole("button", { name: "追加" }));

    expect(await form.findByRole("alert")).toHaveTextContent("タスクの追加に失敗しました");
    expect(form.getByLabelText("タイトル")).toHaveValue("買い物");
  });
});
