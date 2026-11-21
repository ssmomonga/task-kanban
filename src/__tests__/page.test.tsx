import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  test("見出しが表示される", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /to get started/i }),
    ).toBeInTheDocument();
  });

  test("Documentation リンクが新しいタブで開く", () => {
    render(<Home />);
    const link = screen.getByRole("link", { name: "Documentation" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
