"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, RefreshCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import {
  COLS,
  ROWS,
  EMPTY,
  FILLED,
  ACTIVE,
  type Piece,
  createBoard,
  cloneBoard,
  randomPiece,
  collides,
  merge,
  clearLines,
  rotate,
  getLevel,
  getTickMs,
} from "@/lib/game";

function playLineClearSound() {
  const ctx = new AudioContext();
  const notes = [523.25, 1046.5]; // C5 → C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0.25, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
    osc.start(start);
    osc.stop(start + 0.12);
  });
}

function playGameOverSound() {
  const ctx = new AudioContext();
  const notes = [329.63, 261.63, 220.0, 164.81];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.18;
    gain.gain.setValueAtTime(0.3, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
    osc.start(start);
    osc.stop(start + 0.15);
  });
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const shouldPlayRef = useRef(true);

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

      // Block out: 最上行でロックされたらゲームオーバー
      if (piece.y === 0) {
        setGameOver(true);
        setRunning(false);
        return mergedBoard;
      }

      const { board: clearedBoard, cleared } = clearLines(mergedBoard);
      if (cleared > 0) {
        playLineClearSound();
        setLines((prevLines) => prevLines + cleared);
        setScore((prevScore) => prevScore + cleared * 150);
      } else {
        setScore((prevScore) => prevScore + 10);
      }
      setPiece(randomPiece());
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

      // Block out: 最上行でロックされたらゲームオーバー
      if (droppedPiece.y === 0) {
        setGameOver(true);
        setRunning(false);
        return mergedBoard;
      }

      const { board: clearedBoard, cleared } = clearLines(mergedBoard);
      if (cleared > 0) {
        playLineClearSound();
        setLines((prevLines) => prevLines + cleared);
        setScore((prevScore) => prevScore + cleared * 150);
      } else {
        setScore((prevScore) => prevScore + 10);
      }
      setPiece(randomPiece());
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
    audioRef.current = new Audio("/stick-stack/bgm/theme.mp3");
    audioRef.current.loop = true;

    // 最初のユーザー操作で再生を開始する（オートプレイ制限の回避）
    const tryPlay = () => {
      if (shouldPlayRef.current && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("keydown", tryPlay, { once: true });
    document.addEventListener("click", tryPlay, { once: true });

    return () => {
      document.removeEventListener("keydown", tryPlay);
      document.removeEventListener("click", tryPlay);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    shouldPlayRef.current = running && !gameOver;
    if (!audioRef.current) return;
    if (running && !gameOver) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [running, gameOver]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (gameOver) playGameOverSound();
  }, [gameOver]);

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
              <Button className="col-span-2 rounded-xl border-2 border-[#cbb8ff] bg-[#453067] font-mono text-[#f7f0ff] hover:bg-[#533c79]" onClick={() => setMuted((m) => !m)}>
                {muted ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
                {muted ? "UNMUTE" : "MUTE"}
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
