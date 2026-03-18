import { describe, it, expect } from "vitest";
import {
  COLS,
  ROWS,
  EMPTY,
  FILLED,
  SHAPES,
  createBoard,
  cloneBoard,
  collides,
  merge,
  clearLines,
  rotate,
  getLevel,
  getTickMs,
  INITIAL_TICK_MS,
} from "./game";

// テスト用ヘルパー：水平ミノ（中央）
const hPiece = () => ({
  x: Math.floor((COLS - 4) / 2),
  y: 0,
  rotation: "horizontal" as const,
  shape: SHAPES.horizontal,
});

// テスト用ヘルパー：垂直ミノ（中央）
const vPiece = () => ({
  x: 5,
  y: 0,
  rotation: "vertical" as const,
  shape: SHAPES.vertical,
});

describe("createBoard", () => {
  it("20行10列の盤面を生成する", () => {
    const board = createBoard();
    expect(board).toHaveLength(ROWS);
    expect(board[0]).toHaveLength(COLS);
  });

  it("すべてのセルが EMPTY である", () => {
    const board = createBoard();
    expect(board.every((row) => row.every((cell) => cell === EMPTY))).toBe(true);
  });
});

describe("cloneBoard", () => {
  it("盤面をディープコピーする", () => {
    const board = createBoard();
    const copy = cloneBoard(board);
    copy[0][0] = FILLED;
    expect(board[0][0]).toBe(EMPTY);
  });
});

describe("collides", () => {
  it("空の盤面では衝突しない", () => {
    const board = createBoard();
    expect(collides(board, hPiece())).toBe(false);
  });

  it("左端を超えると衝突する", () => {
    const board = createBoard();
    const piece = { ...hPiece(), x: -1 };
    expect(collides(board, piece)).toBe(true);
  });

  it("右端を超えると衝突する", () => {
    const board = createBoard();
    const piece = { ...hPiece(), x: COLS - 3 };
    expect(collides(board, piece)).toBe(true);
  });

  it("下端を超えると衝突する", () => {
    const board = createBoard();
    const piece = { ...vPiece(), y: ROWS - 3 };
    expect(collides(board, piece)).toBe(true);
  });

  it("固定済みブロックに重なると衝突する", () => {
    const board = createBoard();
    board[0][5] = FILLED;
    const piece = { ...vPiece(), x: 5, y: 0 };
    expect(collides(board, piece)).toBe(true);
  });
});

describe("merge", () => {
  it("ミノを盤面に固定する", () => {
    const board = createBoard();
    const piece = { ...hPiece(), y: 0 };
    const next = merge(board, piece);
    expect(next[0][piece.x]).toBe(FILLED);
    expect(next[0][piece.x + 1]).toBe(FILLED);
    expect(next[0][piece.x + 2]).toBe(FILLED);
    expect(next[0][piece.x + 3]).toBe(FILLED);
  });

  it("元の盤面を変更しない", () => {
    const board = createBoard();
    merge(board, hPiece());
    expect(board[0].every((cell) => cell === EMPTY)).toBe(true);
  });
});

describe("clearLines", () => {
  it("完成していない行は消去しない", () => {
    const board = createBoard();
    const { cleared } = clearLines(board);
    expect(cleared).toBe(0);
  });

  it("完成した行を消去して上から空行を補充する", () => {
    const board = createBoard();
    board[ROWS - 1] = Array(COLS).fill(FILLED);
    const { board: next, cleared } = clearLines(board);
    expect(cleared).toBe(1);
    expect(next[0].every((cell) => cell === EMPTY)).toBe(true);
    expect(next).toHaveLength(ROWS);
  });

  it("複数行を同時に消去する", () => {
    const board = createBoard();
    board[ROWS - 1] = Array(COLS).fill(FILLED);
    board[ROWS - 2] = Array(COLS).fill(FILLED);
    const { cleared } = clearLines(board);
    expect(cleared).toBe(2);
  });
});

describe("rotate", () => {
  it("水平ミノを垂直に回転する", () => {
    const board = createBoard();
    const piece = hPiece();
    const rotated = rotate(piece, board);
    expect(rotated.rotation).toBe("vertical");
    expect(rotated.shape).toEqual(SHAPES.vertical);
  });

  it("垂直ミノを水平に回転する", () => {
    const board = createBoard();
    const piece = vPiece();
    const rotated = rotate(piece, board);
    expect(rotated.rotation).toBe("horizontal");
    expect(rotated.shape).toEqual(SHAPES.horizontal);
  });

  it("右端付近では X 座標を補正する", () => {
    const board = createBoard();
    const piece = { ...vPiece(), x: COLS - 1 };
    const rotated = rotate(piece, board);
    expect(rotated.x + rotated.shape[0].length).toBeLessThanOrEqual(COLS);
  });
});

describe("getLevel", () => {
  it("0ラインでレベル1", () => {
    expect(getLevel(0)).toBe(1);
  });

  it("10ラインでレベル2", () => {
    expect(getLevel(10)).toBe(2);
  });

  it("9ラインはまだレベル1", () => {
    expect(getLevel(9)).toBe(1);
  });
});

describe("getTickMs", () => {
  it("レベル1では初期速度を返す", () => {
    expect(getTickMs(1)).toBe(INITIAL_TICK_MS);
  });

  it("レベルが上がるほど速くなる", () => {
    expect(getTickMs(2)).toBeLessThan(getTickMs(1));
  });

  it("最低値 120ms を下回らない", () => {
    expect(getTickMs(100)).toBe(120);
  });
});
