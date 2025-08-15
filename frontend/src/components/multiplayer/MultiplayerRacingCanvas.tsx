import { useRef, useEffect, useState, useCallback } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Game } from "@/lib/game-logic";
import { updatePlayerPosition, finishRace, endRace, subscribeToRaceSession, type RaceSession } from '@/lib/multiplayerService';
import { supabase } from '@/lib/supabaseClient';

interface OpponentData {
  position: { row: number; tile: number; progress: number };
  username: string;
  finished: boolean;
  finishTime?: number;
}

interface MultiplayerRacingCanvasProps {
  sessionCode: string;
  isHost: boolean;
  onGameEnd: (winner: string, hostScore: number, challengerScore: number) => void;
  onBackToLobby: () => void;

}

export function MultiplayerRacingCanvas({
  sessionCode,
  isHost,
  onGameEnd,
  onBackToLobby
}: MultiplayerRacingCanvasProps) {
  const { publicKey } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'racing' | 'finished'>('waiting');
  const [raceTime, setRaceTime] = useState(0);
  const [opponentData, setOpponentData] = useState<OpponentData | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [localFinished, setLocalFinished] = useState(false);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [showDeathPopup, setShowDeathPopup] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownCompleted, setCountdownCompleted] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [_sessionData, setSessionData] = useState<any>(null);
  const [_score, setScore] = useState(0);
  const [_isGameOver, setIsGameOver] = useState(false);
  const [_finalScore, setFinalScore] = useState(0);
  
  const lastUpdateRef = useRef<number>(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const gameStateRef = useRef<'waiting' | 'countdown' | 'racing' | 'finished'>('waiting');
  const countdownStartedRef = useRef<boolean>(false);
  const countdownCompletedRef = useRef<boolean>(false);
  const raceStartedRef = useRef<boolean>(false);
  const localFinishedRef = useRef<boolean>(false);
  const opponentFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('MultiplayerRacingCanvas mounted with:', { sessionCode, isHost });
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    countdownStartedRef.current = countdownStarted;
  }, [countdownStarted]);

  useEffect(() => {
    countdownCompletedRef.current = countdownCompleted;
  }, [countdownCompleted]);

  useEffect(() => {
    raceStartedRef.current = raceStarted;
  }, [raceStarted]);

  useEffect(() => {
    localFinishedRef.current = localFinished;
  }, [localFinished]);

  useEffect(() => {
    opponentFinishedRef.current = opponentFinished;
  }, [opponentFinished]);
  const handlePositionUpdate = useCallback(async (position: { row: number; tile: number; progress: number }) => {
    const now = Date.now();
    if (now - lastUpdateRef.current > 50) {
      lastUpdateRef.current = now;
      console.log(`Sending position update: ${JSON.stringify(position)}`);
      await updatePlayerPosition(sessionCode, isHost, position);
    }
  }, [sessionCode, isHost]);

  const handleFinish = useCallback(async () => {
    if (!localFinishedRef.current) {
      setLocalFinished(true);
      const finishTime = raceTime;
      console.log(`Player finished race in ${finishTime}ms`);
      
      await finishRace(sessionCode, isHost, finishTime);
      
      const { data: session } = await supabase
        .from('multiplayer_sessions')
        .select('*')
        .eq('code', sessionCode)
        .single();
      
      if (session) {
        const hostFinished = !!session.host_finish_time;
        const challengerFinished = !!session.challenger_finish_time;
        
        if (hostFinished && challengerFinished) {
          const hostTime = session.host_finish_time || 0;
          const challengerTime = session.challenger_finish_time || 0;
          const winnerWallet = hostTime < challengerTime ? session.host_wallet : session.challenger_wallet;
          
          console.log(`Race finished! Winner: ${winnerWallet}, Host time: ${hostTime}, Challenger time: ${challengerTime}`);
          
          await endRace(sessionCode, winnerWallet, hostTime, challengerTime);
        } else {
          const winnerWallet = isHost ? session.host_wallet : session.challenger_wallet;
          const winnerTime = finishTime;
          const loserTime = 0;
          
          console.log(`First player finished! Winner: ${winnerWallet}, Time: ${winnerTime}`);
          
          await endRace(sessionCode, winnerWallet, isHost ? winnerTime : loserTime, isHost ? loserTime : winnerTime);
          
          setWinner(winnerWallet);
          setGameState('finished');
          console.log('Fallback: Set winner locally -', winnerWallet);
        }
      }
    }
  }, [sessionCode, isHost, raceTime, localFinishedRef]);



  const handleCollision = useCallback(() => {
    console.log('Player collision detected!');
    setShowDeathPopup(true);
    
    // Hide the popup after 2 seconds
    setTimeout(() => {
      setShowDeathPopup(false);
    }, 2000);
  }, []);

  const handleSessionUpdate = useCallback((session: RaceSession) => {
    console.log('Handling session update:', {
      race_started: session.race_started,
      race_finished: session.race_finished,
      winner_wallet: session.winner_wallet,
      gameState,
      isHost,
      countdownStarted,
      countdownCompleted,
      raceStarted
    });

    setSessionData(session);

    if (session.race_started && gameState === 'waiting' && !countdownStartedRef.current) {
      console.log('Race started! Beginning countdown...');
      setGameState('countdown');
      setTimeout(() => {
        startCountdown();
      }, 50);
      return;
    }
    if (session.host_position && !isHost) {
      const opponentData: OpponentData = {
        position: session.host_position,
        username: session.host_username,
        finished: !!session.host_finish_time,
        finishTime: session.host_finish_time
      };
      setOpponentData(opponentData);
      updateOpponentInGame(opponentData);
      
      if (session.host_finish_time && !opponentFinishedRef.current) {
        setOpponentFinished(true);
      }
    }

    if (session.challenger_position && isHost) {
      const opponentData: OpponentData = {
        position: session.challenger_position,
        username: session.challenger_username || 'Challenger',
        finished: !!session.challenger_finish_time,
        finishTime: session.challenger_finish_time
      };
      setOpponentData(opponentData);
      updateOpponentInGame(opponentData);
      
      if (session.challenger_finish_time && !opponentFinishedRef.current) {
        setOpponentFinished(true);
      }
    }

    if (session.race_finished && session.winner_wallet) {
      console.log('Race finished! Showing winner/loser modal...');
      console.log('Winner wallet:', session.winner_wallet);
      console.log('Current player wallet:', publicKey?.toBase58());
      console.log('Is winner?', session.winner_wallet === publicKey?.toBase58());
      
      setWinner(session.winner_wallet);
      setGameState('finished');
      
      const isWinner = session.winner_wallet === publicKey?.toBase58();
      
      console.log(`Current player ${isWinner ? 'WON' : 'LOST'} the race!`);
    }
  }, [sessionCode, isHost, onGameEnd, publicKey, gameState, countdownStarted]);

  const updateOpponentInGame = useCallback((data: OpponentData) => {
    if (gameInstanceRef.current) {
      console.log(`Updating opponent position: ${JSON.stringify(data.position)}`);
      gameInstanceRef.current.updateOpponent(data);
    } else {
      console.log('Game instance not available for opponent update');
    }
  }, []);

  const startCountdown = useCallback(() => {
    console.log('startCountdown called with state:', { countdownStarted, countdownCompleted, gameState, raceStarted });
    
    if (countdownStartedRef.current) {
      console.log('Countdown already started, skipping...');
      return;
    }
    
    console.log('Starting countdown...');
    setCountdownStarted(true);
    setCountdown(5);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        console.log(`Countdown tick: ${prev} -> ${prev - 1}`);
        if (prev <= 1) {
          clearInterval(countdownInterval);
          console.log('Countdown finished, starting race...');
          setCountdownCompleted(true);
          setRaceStarted(true);
          setGameState('racing');
          lastUpdateRef.current = Date.now();
          
          if (gameInstanceRef.current) {
            gameInstanceRef.current.startRacing();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !publicKey) return;

    console.log('Initializing multiplayer game...');

    gameInstanceRef.current = new Game(
      canvasRef.current,
      setScore,
      setIsGameOver,
      setFinalScore,
      4,
      undefined,
      
    );

    gameInstanceRef.current.setMultiplayerMode(true);
    gameInstanceRef.current.setMultiplayerCallbacks(handlePositionUpdate, handleFinish, handleCollision);

    gameInstanceRef.current.initializeGame();
    gameInstanceRef.current.start();

    return () => {
      console.log('Disposing multiplayer game...');
      if (gameInstanceRef.current) {
        gameInstanceRef.current.dispose();
        gameInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.setMultiplayerCallbacks(handlePositionUpdate, handleFinish, handleCollision);
    }
  }, [handlePositionUpdate, handleFinish, handleCollision]);
  useEffect(() => {
    if (!sessionCode) return;

    console.log('Subscribing to race session:', sessionCode);
    
    const unsubscribe = subscribeToRaceSession(sessionCode, (session: RaceSession) => {
      console.log('Session update received:', session);
      handleSessionUpdate(session);
    });

    unsubscribeRef.current = unsubscribe;

    const getInitialSession = async () => {
      try {
        const { data: session } = await supabase
          .from('multiplayer_sessions')
          .select('*')
          .eq('code', sessionCode)
          .single();
        
        if (session) {
          console.log('Initial session state:', session);
          setSessionData(session);
          if (gameState === 'waiting') {
            handleSessionUpdate(session as RaceSession);
          }
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
      }
    };

    getInitialSession();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [sessionCode, handleSessionUpdate]);

  // Race timer
  useEffect(() => {
    if (gameState !== 'racing') return;

    const interval = setInterval(() => {
      setRaceTime(prev => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (localFinishedRef.current && opponentFinishedRef.current && !winner) {
      const localTime = raceTime;
      const opponentTime = opponentData?.finishTime || 0;
      
      const finalWinner = localTime < opponentTime ? publicKey?.toBase58() : opponentData?.username;
      
      if (finalWinner) {
        setWinner(finalWinner);
        setGameState('finished');
        endRace(sessionCode, finalWinner, 0, 0);
        onGameEnd(finalWinner, 0, 0);
      }
    }
  }, [raceTime, opponentData, winner, sessionCode, publicKey, onGameEnd]);

  useEffect(() => {
    console.log('Game state changed:', {
      gameState,
      countdown,
      countdownStarted,
      countdownCompleted,
      raceStarted,
      localFinished: localFinishedRef.current,
      opponentFinished: opponentFinishedRef.current,
      hasGameInstance: !!gameInstanceRef.current,
      winner
    });
  }, [gameState, countdown, countdownStarted, countdownCompleted, raceStarted, winner]);

  useEffect(() => {
    if (gameState === 'finished') {
      console.log('Finished modal should be showing - winner:', winner, 'publicKey:', publicKey?.toBase58());
    }
  }, [gameState, winner, publicKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== 'racing' || localFinishedRef.current) {
        console.log(`Movement blocked: gameState=${gameState}, localFinished=${localFinishedRef.current}`);
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          if (gameInstanceRef.current) {
            gameInstanceRef.current.queueMove('forward');
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          if (gameInstanceRef.current) {
            gameInstanceRef.current.queueMove('backward');
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          if (gameInstanceRef.current) {
            gameInstanceRef.current.queueMove('left');
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          if (gameInstanceRef.current) {
            gameInstanceRef.current.queueMove('right');
          }
          break;
      }
    };

    if (gameState === 'racing') {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.dispose();
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const formatTime = (time: number) => {
    const seconds = Math.floor(time / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const getPlayerProgress = () => {
    if (!gameInstanceRef.current) return 0;
    const position = gameInstanceRef.current.getPosition();
    return Math.min((position.currentRow / 28) * 100, 100);
  };

  const getOpponentProgress = () => {
    if (!opponentData) return 0;
    return Math.min((opponentData.position.row / 28) * 100, 100);
  };

  const handleControlClick = (direction: string) => {
    if (gameState !== 'racing' || localFinishedRef.current) {
      console.log(`Control click blocked: gameState=${gameState}, localFinished=${localFinishedRef.current}`);
      return;
    }
    
    if (!gameInstanceRef.current) {
      console.log('Game instance not available for movement');
      return;
    }
    
    console.log(`Control click: ${direction}`);
    gameInstanceRef.current.queueMove(direction);
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900">
     
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />

      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        {gameState === 'racing' && (
          <div className="text-center mb-4">
            <div className="text-white font-mono text-2xl bg-black bg-opacity-50 px-4 py-2 rounded inline-block">
              {formatTime(raceTime)}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            {/* Local Player */}
            <div className="bg-black bg-opacity-70 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-['Press_Start_2P'] text-sm">
                  {isHost ? 'Host' : 'Challenger'}
                </span>
                {localFinishedRef.current && (
                  <span className="text-yellow-400 text-sm">🏁</span>
                )}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getPlayerProgress()}%` }}
                />
              </div>
            </div>

            {/* Opponent Player */}
            <div className="bg-black bg-opacity-70 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-['Press_Start_2P'] text-sm">
                  {opponentData?.username || (isHost ? 'Challenger' : 'Host')}
                </span>
                {opponentFinishedRef.current && (
                  <span className="text-yellow-400 text-sm">🏁</span>
                )}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getOpponentProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <div className="bg-black bg-opacity-70 p-3 rounded max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-['Press_Start_2P'] text-xs">Race Track</span>
              <span className="text-white font-['Press_Start_2P'] text-xs">
                {getPlayerProgress().toFixed(1)}% Complete
              </span>
            </div>
            <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
              {/* Start Line */}
              <div className="absolute left-0 top-0 w-1 h-full bg-green-500 z-10"></div>
              <div className="absolute left-1 top-0 text-green-500 text-xs font-bold">🏁 START</div>
              
              {/* Finish Line */}
              <div className="absolute right-0 top-0 w-1 h-full bg-red-500 z-10"></div>
              <div className="absolute right-1 top-0 text-red-500 text-xs font-bold">🏁 FINISH</div>
              
              {/* Player Position */}
              <div 
                className="absolute top-0 w-2 h-full bg-green-400 z-20 transition-all duration-300"
                style={{ left: `${getPlayerProgress()}%` }}
              ></div>
              
              {/* Opponent Position */}
              <div 
                className="absolute top-0 w-2 h-full bg-red-400 z-20 transition-all duration-300"
                style={{ left: `${getOpponentProgress()}%` }}
              ></div>
              
              {getPlayerProgress() > 85 && (
                <div className="absolute right-0 top-0 w-full h-full bg-red-500 bg-opacity-20 animate-pulse z-5"></div>
              )}
            </div>
            
            {getPlayerProgress() > 90 && (
              <div className="mt-2 text-center">
                <span className="text-red-400 text-sm font-bold animate-pulse">🏁 FINISH LINE AHEAD! 🏁</span>
              </div>
            )}
          </div>
        </div>

        {gameState === 'racing' && (
          <div className="text-center mt-4">
            <p className="text-gray-300 text-sm bg-black bg-opacity-50 px-4 py-2 rounded inline-block">
              Use WASD or Arrow Keys to move • First to finish line wins!
            </p>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="text-center mt-4">
            <p className="text-yellow-400 text-sm bg-black bg-opacity-50 px-4 py-2 rounded inline-block">
              Controls disabled during countdown • Get ready to race!
            </p>
          </div>
        )}
      </div>

      {gameState === 'waiting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center text-white">
            <h2 className="text-2xl font-['Press_Start_2P'] mb-4">Waiting for Race to Start</h2>
            <p>Session Code: <span className="text-yellow-400 font-mono">{sessionCode}</span></p>
            <div className="mt-4">
              <p className="text-gray-300">Host will start the race when ready...</p>
              {isHost && (
                <div className="mt-4">
                  <p className="text-green-400 text-sm">You are the Host</p>
                  <p className="text-gray-300 text-sm">Click "Start Race" when ready!</p>
                </div>
              )}
              {!isHost && (
                <div className="mt-4">
                  <p className="text-blue-400 text-sm">You are the Challenger</p>
                  <p className="text-gray-300 text-sm">Waiting for host to start...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Death Popup */}
      {showDeathPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="text-center text-white bg-red-900 bg-opacity-80 p-8 rounded-lg border-4 border-red-500">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-4xl font-['Press_Start_2P'] mb-4 text-red-400">YOU DIED!</h2>
            <p className="text-xl text-gray-300">Hit by a vehicle!</p>
            <p className="text-lg text-yellow-400 mt-2">Resetting to starting point...</p>
          </div>
        </div>
      )}

      {gameState === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center text-white">
            <div className="text-8xl font-['Press_Start_2P'] text-yellow-400 mb-4">
              {countdown}
            </div>
            <div className="text-2xl font-['Press_Start_2P']">
              {countdown > 0 ? 'Get Ready!' : 'GO!'}
            </div>
            <div className="mt-4 text-gray-300">
              <p>🐝 Race to the finish line!</p>
              <p>First bee to cross wins!</p>
            </div>
          </div>
        </div>
      )}



      {gameState === 'finished' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4 transform transition-all">
            <div className="text-center">
              {winner === publicKey?.toBase58() ? (
                <>
                  <div className="text-6xl mb-6">🏆</div>
                  <h2 className="text-3xl font-['Press_Start_2P'] mb-6 text-green-600">Congratulations!</h2>
                  <div className="space-y-3 text-sm mb-8 text-gray-700">
                    <p className="text-green-600 font-semibold">🎉 You reached the finish line first!</p>
                    <p>Your Time: <span className="text-green-600 font-bold">{formatTime(raceTime)}</span></p>
                    {opponentData?.finishTime && (
                      <p>Opponent Time: <span className="text-red-600 font-bold">{formatTime(opponentData.finishTime)}</span></p>
                    )}
                    <p className="text-green-600 font-bold text-lg">🏁 FIRST TO FINISH! 🏁</p>
                    

                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-6">😔</div>
                  <h2 className="text-3xl font-['Press_Start_2P'] mb-6 text-red-600">You Lost!</h2>
                  <div className="space-y-3 text-sm mb-8 text-gray-700">
                    <p className="text-red-600 font-semibold">Better luck next time!</p>
                    <p>Your Time: <span className="text-yellow-600 font-bold">{formatTime(raceTime)}</span></p>
                    {opponentData?.finishTime && (
                      <p>Winner Time: <span className="text-green-600 font-bold">{formatTime(opponentData.finishTime)}</span></p>
                    )}
                    <p>Winner: <span className="text-green-600 font-bold">{opponentData?.username || 'Opponent'}</span></p>
                    <p className="text-red-600 font-bold text-lg">🏁 OPPONENT FINISHED FIRST! 🏁</p>
                    

                  </div>
                </>
              )}
              <button
                onClick={() => {
                  if (winner) {
                    onGameEnd(winner, 0, 0);
                  }
                  onBackToLobby();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-['Press_Start_2P'] px-8 py-4 rounded-lg transition-colors text-lg shadow-lg"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-5 left-0 right-0 flex justify-center z-10">
        <div className="grid grid-cols-3 gap-2.5">
          <button
            id="forward"
            onClick={() => handleControlClick("forward")}
            className="col-span-3 w-full h-10 bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={gameState !== 'racing' || localFinishedRef.current}
          >
            ▲
          </button>
          <button
            id="left"
            onClick={() => handleControlClick("left")}
            className="w-full h-10 bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={gameState !== 'racing' || localFinishedRef.current}
          >
            ◀
          </button>
          <button
            id="backward"
            onClick={() => handleControlClick("backward")}
            className="w-full h-10 bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={gameState !== 'racing' || localFinishedRef.current}
          >
            ▼
          </button>
          <button
            id="right"
            onClick={() => handleControlClick("right")}
            className="w-full h-10 bg-white border border-gray-300 shadow-[3px_5px_0px_0px_rgba(0,0,0,0.75)] cursor-pointer outline-none font-['Press_Start_2P'] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={gameState !== 'racing' || localFinishedRef.current}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}