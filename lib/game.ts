export const COLS = 10;
export const ROWS = 20;
export const EMPTY = 0;
export const FILLED = 1;
export const ACTIVE = 2;
export const INITIAL_TICK_MS = 520;

export const SHAPES = {
  horizontal: [[1, 1, 1, 1]],
  vertical: [[1], [1], [1], [1]],
};

export type Rotation = "horizontal" | "vertical";

export interface Piece {
  x: number;
  y: number;
  rotation: Rotation;
  shape: number[][];
}

/**
 * 空のゲーム盤面を生成する。
 */
export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

/**
 * 盤面をディープコピーする。
 */
export function cloneBoard(board: number[][]) {
  return board.map((row) => [...row]);
}

/**
 * 棒ミノをランダムな向きで生成する。
 */
export function randomPiece(): Piece {
  const rotation: Rotation = Math.random() < 0.5 ? "horizontal" : "vertical";
  const shape = SHAPES[rotation];
  const width = shape[0].length;

  return {
    x: Math.floor((COLS - width) / 2),
    y: 0,
    rotation,
    shape,
  };
}

/**
 * 指定位置と指定形状でミノが衝突するか判定する。
 */
export function collides(
  board: number[][],
  piece: Piece,
  nextX = piece.x,
  nextY = piece.y,
  nextShape = piece.shape
) {
  for (let y = 0; y < nextShape.length; y += 1) {
    for (let x = 0; x < nextShape[y].length; x += 1) {
      if (!nextShape[y][x]) continue;

      const boardX = nextX + x;
      const boardY = nextY + y;

      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
        return true;
      }

      if (boardY >= 0 && board[boardY][boardX] === FILLED) {
        return true;
      }
    }
  }

  return false;
}

/**
 * ミノを盤面へ固定反映した新しい盤面を返す。
 */
export function merge(board: number[][], piece: Piece) {
  const next = cloneBoard(board);

  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) return;

      const boardY = piece.y + y;
      const boardX = piece.x + x;

      if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
        next[boardY][boardX] = FILLED;
      }
    });
  });

  return next;
}

/**
 * 完成したラインを消去し、消去数と新しい盤面を返す。
 */
export function clearLines(board: number[][]) {
  const keptRows = board.filter((row) => row.some((cell) => cell === EMPTY));
  const cleared = ROWS - keptRows.length;
  const freshRows = Array.from({ length: cleared }, () => Array(COLS).fill(EMPTY));

  return {
    board: [...freshRows, ...keptRows],
    cleared,
  };
}

/**
 * 棒ミノを水平・垂直で回転させる。
 * 壁際では簡易キックを試みる。
 */
export function rotate(piece: Piece, board: number[][]): Piece {
  const nextRotation: Rotation = piece.rotation === "horizontal" ? "vertical" : "horizontal";
  const nextShape = SHAPES[nextRotation];
  let nextX = piece.x;

  if (nextX + nextShape[0].length > COLS) {
    nextX = COLS - nextShape[0].length;
  }

  if (nextX < 0) {
    nextX = 0;
  }

  if (!collides(board, piece, nextX, piece.y, nextShape)) {
    return {
      ...piece,
      x: nextX,
      rotation: nextRotation,
      shape: nextShape,
    };
  }

  const kicks = [1, -1, 2, -2];
  for (const dx of kicks) {
    if (!collides(board, piece, nextX + dx, piece.y, nextShape)) {
      return {
        ...piece,
        x: nextX + dx,
        rotation: nextRotation,
        shape: nextShape,
      };
    }
  }

  return piece;
}

/**
 * 進行状況からレベルを計算する。
 */
export function getLevel(lines: number) {
  return Math.floor(lines / 10) + 1;
}

/**
 * レベルに応じた落下速度を算出する。
 */
export function getTickMs(level: number) {
  return Math.max(120, INITIAL_TICK_MS - (level - 1) * 40);
}
