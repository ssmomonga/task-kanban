import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormError } from "@/app/_components/form-error";

describe("FormError", () => {
  it("メッセージを渡すと、alert としてその文言を表示する", () => {
    render(<FormError message="タイトルを入力してください" />);

    expect(screen.getByRole("alert")).toHaveTextContent("タイトルを入力してください");
  });
});
