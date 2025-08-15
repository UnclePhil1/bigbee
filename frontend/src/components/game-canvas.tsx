import { useRef, useEffect } from "react";
import { Game } from "@/lib/game-logic";

interface GameCanvasProps {
  setScore: (score: number) => void;
  setGameOver: (isOver: boolean) => void;
  setFinalScore: (score: number) => void;
  isGameStarted: boolean;
  isGameOver: boolean;
  stageId?: number;
  onHoneyJarCollected?: () => void;

}

export function GameCanvas({
  setScore,
  setGameOver,
  setFinalScore,
  isGameStarted,
  isGameOver,
  stageId = 1,
  onHoneyJarCollected,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstanceRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (isGameStarted && !gameInstanceRef.current) {
      gameInstanceRef.current = new Game(
        canvasRef.current,
        setScore,
        setGameOver,
        setFinalScore,
        stageId,
        onHoneyJarCollected
      );
      gameInstanceRef.current.start();
    } else if (!isGameStarted && gameInstanceRef.current) {
      gameInstanceRef.current.dispose();
      gameInstanceRef.current = null;
    }

    const handleResize = () => {
      if (gameInstanceRef.current && isGameStarted) {
        gameInstanceRef.current.dispose();
        gameInstanceRef.current = new Game(
          canvasRef.current!,
          setScore,
          setGameOver,
          setFinalScore,
          stageId,
          onHoneyJarCollected
        );
        gameInstanceRef.current.start();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.dispose();
        gameInstanceRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [
    isGameStarted,
    setScore,
    setGameOver,
    setFinalScore,
    stageId,
    onHoneyJarCollected,

  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isGameStarted || isGameOver) return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        gameInstanceRef.current?.queueMove("forward");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        gameInstanceRef.current?.queueMove("backward");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        gameInstanceRef.current?.queueMove("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        gameInstanceRef.current?.queueMove("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isGameStarted, isGameOver]);

  const handleControlClick = (direction: string) => {
    if (!isGameStarted || isGameOver) return;
    gameInstanceRef.current?.queueMove(direction);
  };

  return (
    <>
      <canvas ref={canvasRef} className="game w-full h-screen block"></canvas>
      <div
        id="controls"
        className="absolute bottom-5 w-full flex items-end justify-center"
      >
        <div className="grid grid-cols-3 gap-2.5">
          <button
            id="forward"
            onClick={() => handleControlClick("forward")}
            className="col-span-3 w-[60px] h-[60px] rounded-full bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg mx-auto active:shadow-[1px_2px_0px_0px_rgba(0,0,0,0.75)] active:translate-y-[3px] transition-all duration-75 ease-in"
            disabled={!isGameStarted || isGameOver}
          >
            ▲
          </button>

          <button
            id="left"
            onClick={() => handleControlClick("left")}
            className="w-[60px] h-[60px] rounded-full bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg active:shadow-[1px_2px_0px_0px_rgba(0,0,0,0.75)] active:translate-y-[3px] transition-all duration-75 ease-in"
            disabled={!isGameStarted || isGameOver}
          >
            ◀
          </button>

          <button
            id="backward"
            onClick={() => handleControlClick("backward")}
            className="w-[60px] h-[60px] rounded-full bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg active:shadow-[1px_2px_0px_0px_rgba(0,0,0,0.75)] active:translate-y-[3px] transition-all duration-75 ease-in"
            disabled={!isGameStarted || isGameOver}
          >
            ▼
          </button>

          <button
            id="right"
            onClick={() => handleControlClick("right")}
            className="w-[60px] h-[60px] rounded-full bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg active:shadow-[1px_2px_0px_0px_rgba(0,0,0,0.75)] active:translate-y-[3px] transition-all duration-75 ease-in"
            disabled={!isGameStarted || isGameOver}
          >
            ▶
          </button>
        </div>
      </div>
    </>
  );
}
