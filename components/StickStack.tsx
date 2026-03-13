"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, RefreshCcw, RotateCw } from "lucide-react";

const COLS = 10;
const ROWS = 20;
const EMPTY = 0;
const FILLED = 1;
const ACTIVE = 2;
const INITIAL_TICK_MS = 520;

const SHAPES = {
  horizontal: [[1, 1, 1, 1]],
  vertical: [[1], [1], [1], [1]],
};

/**
 * 空のゲーム盤面を生成する。
 *
 * @returns {number[][]} 20 行 10 列の空盤面。
 */
function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

/**
 * 盤面をディープコピーする。
 *
 * @param {number[][]} board コピー元の盤面。
 * @returns {number[][]} 複製後の盤面。
 */
function cloneBoard(board: number[][]) {
  return board.map((row) => [...row]);
}

type Rotation = "horizontal" | "vertical";

interface Piece {
  x: number;
  y: number;
  rotation: Rotation;
  shape: number[][];
}

/**
 * 棒ミノをランダムな向きで生成する。
 *
 * @returns {Piece} 生成されたミノ情報。
 */
function randomPiece(): Piece {
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
function collides(
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
function merge(board: number[][], piece: Piece) {
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
function clearLines(board: number[][]) {
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
function rotate(piece: Piece, board: number[][]): Piece {
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
function getLevel(lines: number) {
  return Math.floor(lines / 10) + 1;
}

/**
 * レベルに応じた落下速度を算出する。
 */
function getTickMs(level: number) {
  return Math.max(120, INITIAL_TICK_MS - (level - 1) * 40);
}

/**
 * レトロ風の盤面を描画するコンポーネント。
 */
function BoardView({ board, piece }: { board: number[][]; piece: Piece | null }) {
  const displayBoard = useMemo(() => {
    const next = cloneBoard(board);

    if (piece) {
      piece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (!cell) return;

          const boardY = piece.y + y;
          const boardX = piece.x + x;

          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            next[boardY][boardX] = ACTIVE;
          }
        });
      });
    }

    return next;
  }, [board, piece]);

  return (
    <div className="rounded-[1.75rem] border-4 border-amber-200 bg-[#1a1230] p-3 shadow-[0_0_0_4px_#3a275f,0_18px_50px_rgba(0,0,0,0.45)]">
      <div
        className="grid gap-0 rounded-xl border-4 border-[#4e357c] bg-[#120b22] p-2"
        style={{ gridTemplateColumns: `repeat(${COLS}, 2rem)` }}
      >
        {displayBoard.flatMap((row, y) =>
          row.map((cell, x) => {
            const cellClass =
              cell === ACTIVE
                ? "bg-cyan-300 border-cyan-100"
                : cell === FILLED
                  ? "bg-cyan-500 border-cyan-200"
                  : "bg-[#24163f] border-[#38255f]";

            return (
              <div
                key={`${x}-${y}`}
                className={`h-8 w-8 border-2 shadow-[inset_2px_2px_0_rgba(255,255,255,0.18)] ${cellClass}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * 棒ミノだけが落ちるレトロ風テトリス本体コンポーネント。
 */
export default function StickStack() {
  const [board, setBoard] = useState(createBoard);
  const [piece, setPiece] = useState<Piece>(() => randomPiece());
  const [running, setRunning] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const level = getLevel(lines);
  const tickMs = getTickMs(level);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setPiece(randomPiece());
    setRunning(true);
    setGameOver(false);
    setScore(0);
    setLines(0);
  }, []);

  const lockPiece = useCallback(() => {
    if (!piece) return;

    setBoard((prevBoard) => {
      const mergedBoard = merge(prevBoard, piece);
      const { board: clearedBoard, cleared } = clearLines(mergedBoard);

      if (cleared > 0) {
        setLines((prevLines) => prevLines + cleared);
        setScore((prevScore) => prevScore + cleared * 150);
      } else {
        setScore((prevScore) => prevScore + 10);
      }

      const nextPiece = randomPiece();
      if (collides(clearedBoard, nextPiece)) {
        setGameOver(true);
        setRunning(false);
      } else {
        setPiece(nextPiece);
      }

      return clearedBoard;
    });
  }, [piece]);

  const stepDown = useCallback(() => {
    if (!piece || gameOver) return;

    if (!collides(board, piece, piece.x, piece.y + 1, piece.shape)) {
      setPiece((prevPiece) => (prevPiece ? { ...prevPiece, y: prevPiece.y + 1 } : prevPiece));
      return;
    }

    lockPiece();
  }, [board, gameOver, lockPiece, piece]);

  const move = useCallback(
    (dx: number) => {
      if (!piece || gameOver) return;

      if (!collides(board, piece, piece.x + dx, piece.y, piece.shape)) {
        setPiece((prevPiece) => (prevPiece ? { ...prevPiece, x: prevPiece.x + dx } : prevPiece));
      }
    },
    [board, gameOver, piece]
  );

  const hardDrop = useCallback(() => {
    if (!piece || gameOver) return;

    let nextY = piece.y;
    while (!collides(board, piece, piece.x, nextY + 1, piece.shape)) {
      nextY += 1;
    }

    const droppedPiece = { ...piece, y: nextY };

    setBoard((prevBoard) => {
      const mergedBoard = merge(prevBoard, droppedPiece);
      const { board: clearedBoard, cleared } = clearLines(mergedBoard);

      if (cleared > 0) {
        setLines((prevLines) => prevLines + cleared);
        setScore((prevScore) => prevScore + cleared * 150);
      } else {
        setScore((prevScore) => prevScore + 10);
      }

      const nextPiece = randomPiece();
      if (collides(clearedBoard, nextPiece)) {
        setGameOver(true);
        setRunning(false);
      } else {
        setPiece(nextPiece);
      }

      return clearedBoard;
    });
  }, [board, gameOver, piece]);

  const rotatePiece = useCallback(() => {
    if (!piece || gameOver) return;
    setPiece((prevPiece) => (prevPiece ? rotate(prevPiece, board) : prevPiece));
  }, [board, gameOver, piece]);

  const toggleRunning = useCallback(() => {
    if (gameOver) return;
    setRunning((prevRunning) => !prevRunning);
  }, [gameOver]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowDown") stepDown();
      if (event.key === "ArrowUp") rotatePiece();
      if (event.key === " ") hardDrop();
      if (event.key.toLowerCase() === "p") toggleRunning();
      if (event.key.toLowerCase() === "r") resetGame();
    },
    [hardDrop, move, resetGame, rotatePiece, stepDown, toggleRunning]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!running || gameOver) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
      return;
    }

    tickRef.current = setInterval(stepDown, tickMs);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
    };
  }, [gameOver, running, stepDown, tickMs]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#3a275f_0%,_#170f2b_45%,_#08060d_100%)] p-6 text-[#fff5d6]">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[auto_320px]">
        <Card className="rounded-[2rem] border-4 border-[#ffcf6a] bg-[#2a1d45] shadow-[0_0_0_4px_#5d448a,0_20px_50px_rgba(0,0,0,0.5)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="font-mono text-3xl tracking-wide text-[#ffe9a3]">
                  STICKSTACK
                </CardTitle>
                <p className="mt-2 font-mono text-sm text-[#dbc7ff]">
                  棒だけが降る、やたらストイックなレトロ落ち物パズル。
                </p>
              </div>
              <Badge className="rounded-full border border-[#ffe08a] bg-[#5a3f8b] px-3 py-1 font-mono text-[#fff0b8]">
                I-ONLY
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <BoardView board={board} piece={gameOver ? null : piece} />
            </div>
            {gameOver && (
              <div className="mt-4 rounded-2xl border-4 border-[#ff9f7c] bg-[#5b2131] p-4 font-mono text-[#ffd9c8]">
                GAME OVER / Rキーで再スタート
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-4 border-[#ffcf6a] bg-[#2a1d45] shadow-[0_0_0_4px_#5d448a,0_16px_40px_rgba(0,0,0,0.5)]">
            <CardHeader>
              <CardTitle className="font-mono text-xl tracking-wide text-[#ffe9a3]">STATUS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between border-2 border-[#7d5bb3] bg-[#1d1530] p-3">
                <span className="text-[#bca9df]">SCORE</span>
                <span className="text-lg font-bold text-[#fff2b6]">{score}</span>
              </div>
              <div className="flex items-center justify-between border-2 border-[#7d5bb3] bg-[#1d1530] p-3">
                <span className="text-[#bca9df]">LINES</span>
                <span className="text-lg font-bold text-[#fff2b6]">{lines}</span>
              </div>
              <div className="flex items-center justify-between border-2 border-[#7d5bb3] bg-[#1d1530] p-3">
                <span className="text-[#bca9df]">LEVEL</span>
                <span className="text-lg font-bold text-[#fff2b6]">{level}</span>
              </div>
              <div className="flex items-center justify-between border-2 border-[#7d5bb3] bg-[#1d1530] p-3">
                <span className="text-[#bca9df]">STATE</span>
                <span className="text-lg font-bold text-[#fff2b6]">
                  {gameOver ? "OVER" : running ? "PLAY" : "PAUSE"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-4 border-[#ffcf6a] bg-[#2a1d45] shadow-[0_0_0_4px_#5d448a,0_16px_40px_rgba(0,0,0,0.5)]">
            <CardHeader>
              <CardTitle className="font-mono text-xl tracking-wide text-[#ffe9a3]">CONTROL</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button className="rounded-xl border-2 border-[#ffe08a] bg-[#5a3f8b] font-mono text-[#fff0b8] hover:bg-[#6b4d9f]" onClick={toggleRunning}>
                {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {running ? "PAUSE" : "PLAY"}
              </Button>
              <Button className="rounded-xl border-2 border-[#cbb8ff] bg-[#453067] font-mono text-[#f7f0ff] hover:bg-[#533c79]" onClick={resetGame}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                RESET
              </Button>
              <Button className="rounded-xl border-2 border-[#cbb8ff] bg-[#453067] font-mono text-[#f7f0ff] hover:bg-[#533c79]" onClick={() => move(-1)}>
                LEFT
              </Button>
              <Button className="rounded-xl border-2 border-[#cbb8ff] bg-[#453067] font-mono text-[#f7f0ff] hover:bg-[#533c79]" onClick={() => move(1)}>
                RIGHT
              </Button>
              <Button className="rounded-xl border-2 border-[#cbb8ff] bg-[#453067] font-mono text-[#f7f0ff] hover:bg-[#533c79]" onClick={stepDown}>
                DOWN
              </Button>
              <Button className="rounded-xl border-2 border-[#cbb8ff] bg-[#453067] font-mono text-[#f7f0ff] hover:bg-[#533c79]" onClick={rotatePiece}>
                <RotateCw className="mr-2 h-4 w-4" />
                ROTATE
              </Button>
              <Button className="col-span-2 rounded-xl border-2 border-[#ffe08a] bg-[#5a3f8b] font-mono text-[#fff0b8] hover:bg-[#6b4d9f]" onClick={hardDrop}>
                HARD DROP
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-4 border-[#ffcf6a] bg-[#2a1d45] shadow-[0_0_0_4px_#5d448a,0_16px_40px_rgba(0,0,0,0.5)]">
            <CardHeader>
              <CardTitle className="font-mono text-xl tracking-wide text-[#ffe9a3]">KEY GUIDE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm text-[#f3eaff]">
              <p>← → : MOVE</p>
              <p>↑ : ROTATE</p>
              <p>↓ : SOFT DROP</p>
              <p>SPACE : HARD DROP</p>
              <p>P : PAUSE</p>
              <p>R : RESET</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
