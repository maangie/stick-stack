import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NextPiece from "@/components/NextPiece";
import "@testing-library/jest-dom/vitest";

describe("NextPiece", () => {
  it("NEXT ラベルが表示される", () => {
    render(<NextPiece />);
    expect(screen.getByText("NEXT")).toBeInTheDocument();
  });

  it("棒ミノ（4 ブロック）が描画される", () => {
    const { container } = render(<NextPiece />);
    // 4x1 の棒ミノを表す 4 つのセル
    const grid = container.querySelector(".grid-cols-4");
    expect(grid).toBeInTheDocument();
    expect(grid?.children).toHaveLength(4);
  });

  it("再レンダリングしてもパネルが消えない（リセット後の再描画を模擬）", () => {
    const { rerender } = render(<NextPiece />);
    expect(screen.getByText("NEXT")).toBeInTheDocument();

    // 再レンダリング（リセット相当）
    rerender(<NextPiece />);
    expect(screen.getByText("NEXT")).toBeInTheDocument();

    const grid = document.querySelector(".grid-cols-4");
    expect(grid?.children).toHaveLength(4);
  });
});
