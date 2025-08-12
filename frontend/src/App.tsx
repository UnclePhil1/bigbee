import { useState, useCallback, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { StageSelect } from "./components/stage-select";
import { MissionHUD } from "./components/mission-hud";
import { GameCompleteModal } from "./components/game-complete-modal";
import { Button } from "./components/ui/button";
import { StageManager } from "@/lib/stage-manager";
import { SolanaGameState } from "@/lib/solana-game-state";
import type { MissionProgress, Stage } from "@/types/game-types";
import { supabase } from "@/lib/supabaseClient";
import { loadUserProgress, saveUserProgress, completeStage, updateLoyaltyProgress } from "@/lib/supabaseUserProgress";
import { honeycombBackendService } from "./lib/honeycombBackendService";
import { verxioLoyaltyService, type LoyaltyUser, type Voucher } from "@/lib/verxioLoyaltyService";
import { LoyaltyHUD } from "./components/loyalty-hud";
import { RewardsModal } from "./components/rewards-modal";
import cross from "@/assets/cross.png";
import { HowToPlay } from "./components/how-to-play.tsx";
import { GameCanvas } from "./components/game-canvas.tsx";
import { MultiplayerLobby } from "./components/multiplayer/MultiplayerLobby";
import { MultiplayerRacingCanvas } from "./components/multiplayer/MultiplayerRacingCanvas";

type GameScreen = "lobby" | "stage-select" | "playing" | "paused" | "complete" | "multiplayer" | "multiplayer-racing";

export default function App() {

  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();

  const [gameScreen, setGameScreen] = useState<GameScreen>("lobby");
  const [stageManager, setStageManager] = useState<StageManager>(
    new StageManager()
  );
  const [solanaGameState] = useState(new SolanaGameState(connection));
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [missionProgress, setMissionProgress] = useState<MissionProgress>({
    type: "collect",
    current: 0,
    target: 3,
    timeRemaining: 60,
  });
  const [gameSuccess, setGameSuccess] = useState(false);
  const [showWalletWarning, setShowWalletWarning] = useState(false);

  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [honeyJarsCollected, setHoneyJarsCollected] = useState(0);
  const [username, setUsername] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const [loyaltyUser, setLoyaltyUser] = useState<LoyaltyUser>({
    walletAddress: "",
    currentTier: "Honey Bee",
    totalXP: 0,
    currentStreak: 0,
    lastLoginDate: "",
    vouchers: []
  });
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [multiplayerSession, setMultiplayerSession] = useState<{ code: string; isHost: boolean } | null>(null);


  const handleSaveUsername = async () => {
    setUsernameError("");
    if (!username || !publicKey) {
      setUsernameError("Username and wallet required.");
      return;
    }
    const { error } = await supabase
      .from("users")
      .upsert([{ wallet_address: publicKey.toBase58(), username }]);
    if (error) {
      setUsernameError(error.message);
    } else {
      setUsernameSaved(true);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      if (connected && publicKey) {
        solanaGameState.setPlayerWallet(publicKey);
        setShowWalletWarning(false);

        const { data: userData } = await supabase
          .from("users")
          .select("username")
          .eq("wallet_address", publicKey.toBase58())
          .single();

        if (userData && userData.username) {
          setUsername(userData.username);
          setUsernameSaved(true);

          const progress = await loadUserProgress(publicKey.toBase58());
          if (progress) {
            console.log("Loading user progress:", progress);
            const newStageManager = new StageManager({
              currentStage: progress.currentStage,
              completedStages: progress.completedStages,
              totalHoney: progress.totalHoney,
              totalXP: progress.totalXP,
              powerUps: [],
            });
            console.log(
              "New stage manager stages:",
              newStageManager.getStages().map((s) => ({
                id: s.id,
                unlocked: s.unlocked,
                completed: s.completed,
              }))
            );
            setStageManager(newStageManager);
            
            setLoyaltyUser(prev => ({
              ...prev,
              walletAddress: progress.walletAddress,
              currentTier: progress.loyaltyTier,
              totalXP: progress.totalXP,
              currentStreak: progress.loyaltyStreak,
              lastLoginDate: progress.loyaltyLastLogin,
            }));
          }

          try {
            await initializeLoyaltyUser(publicKey.toBase58());
          } catch (error) {
            console.error("Failed to initialize loyalty system:", error);
          }
        } else {
          setUsername("");
          setUsernameSaved(false);
        }
      } else if (!connected && gameScreen === "playing") {
        handleWalletDisconnect();
      }
    };

    checkUser();
  }, [connected, publicKey]);



  const saveGameState = async () => {
    await solanaGameState.saveGameState(stageManager.getGameState());
  };

  const handleWalletDisconnect = () => {
    setShowWalletWarning(true);
    setGameScreen("lobby");
    saveGameState();
    
    // Reset loyalty state
    setLoyaltyUser({
      walletAddress: "",
      currentTier: "Honey Bee",
      totalXP: 0,
      currentStreak: 0,
      lastLoginDate: "",
      vouchers: []
    });
    // Reset loyalty multiplier
  };

  const initializeLoyaltyUser = async (walletAddress: string) => {
    try {
      const newUser: LoyaltyUser = {
        walletAddress,
        currentTier: "Honey Bee",
        totalXP: 0,
        currentStreak: 1,
        lastLoginDate: new Date().toISOString(),
        vouchers: []
      };
      
      setLoyaltyUser(newUser);
      
      try {
        await verxioLoyaltyService.issueLoyaltyPass(walletAddress, username || "Player");
        console.log("Loyalty pass issued successfully");
      } catch (error) {
        console.log("Loyalty pass issuance failed (continuing with local state):", error);
      }
      
      const multiplier = verxioLoyaltyService.getTierMultiplier(newUser.currentTier);
      console.log(`Loyalty multiplier: ${multiplier}x`);
      
    } catch (error) {
      console.error("Failed to initialize loyalty user:", error);
    }
  };

  const processLoyaltyRewards = async (stageId: number, honeyCollected: number, timeElapsed: number, isPerfect: boolean = false) => {
    if (!publicKey) return;
    
    try {
      const rewards = await verxioLoyaltyService.processStageCompletion(
        publicKey.toBase58(),
        stageId,
        honeyCollected,
        timeElapsed,
        isPerfect
      );
      
      // Update local loyalty state
      const totalPointsEarned = rewards.reduce((sum, reward) => sum + reward.amount, 0);
      
      setLoyaltyUser(prev => {
        const newTotalXP = prev.totalXP + totalPointsEarned;
        const newTier = verxioLoyaltyService.getCurrentTier(newTotalXP);
        
        return {
          ...prev,
          totalXP: newTotalXP,
          currentTier: newTier
        };
      });
      
      // Check for tier upgrade and send voucher
      const currentTier = verxioLoyaltyService.getCurrentTier(loyaltyUser.totalXP);
      const newTier = verxioLoyaltyService.getCurrentTier(loyaltyUser.totalXP + totalPointsEarned);
      
      if (currentTier !== newTier) {
        // Tier upgrade - send congratulatory voucher
        try {
          await verxioLoyaltyService.mintVoucher(
            publicKey.toBase58(),
            'xp_boost',
            100,
            7 // 7 days expiry
          );
          
          setLoyaltyUser(prev => ({
            ...prev,
            vouchers: [...prev.vouchers, {
              id: `tier-upgrade-${Date.now()}`,
              type: 'xp_boost',
              value: 100,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              isRedeemed: false
            }]
          }));
          
          console.log(`Tier upgrade to ${newTier}! Voucher sent.`);
        } catch (error) {
          console.log("Failed to send tier upgrade voucher:", error);
        }
      }
      
      console.log("Loyalty rewards processed:", rewards);
      
    } catch (error) {
      console.error("Failed to process loyalty rewards:", error);
    }
  };

  const handleRedeemVoucher = async (voucher: Voucher) => {
    try {
      // Apply voucher effect
      switch (voucher.type) {
        case 'honey_boost':
          // Increase honey collection for next stage
          console.log(`Honey boost applied: +${voucher.value}%`);
          break;
        case 'xp_boost':
          // Add XP bonus
          setLoyaltyUser(prev => ({
            ...prev,
            totalXP: prev.totalXP + voucher.value
          }));
          break;
        case 'skin_unlock':
          // Unlock new skin (would need skin system)
          console.log("Skin unlocked:", voucher.value);
          break;
        case 'mission_unlock':
          // Unlock special mission (would need mission system)
          console.log("Mission unlocked:", voucher.value);
          break;
      }
      
      // Mark voucher as redeemed
      setLoyaltyUser(prev => ({
        ...prev,
        vouchers: prev.vouchers.map(v => 
          v.id === voucher.id ? { ...v, isRedeemed: true } : v
        )
      }));
      
      console.log(`Voucher ${voucher.type} redeemed successfully`);
      
    } catch (error) {
      console.error("Failed to redeem voucher:", error);
    }
  };

  const handleStartGame = useCallback(() => {
    if (!connected) return;
    setGameScreen("stage-select");
  }, [connected]);

  const handleMultiplayerStart = useCallback(() => {
    if (!connected) return;
    setGameScreen("multiplayer");
  }, [connected]);



  const handleMultiplayerGameStart = useCallback((sessionCode: string, isHost: boolean) => {
    setMultiplayerSession({ code: sessionCode, isHost });
    setGameScreen("multiplayer-racing");
  }, []);

  const handleMultiplayerGameEnd = useCallback((winner: string, hostScore: number, challengerScore: number) => {
    console.log(`Race finished! Winner: ${winner}, Host: ${hostScore}, Challenger: ${challengerScore}`);
    setMultiplayerSession(null);
    setGameScreen("lobby");
  }, []);

  const handleBackToMultiplayerLobby = useCallback(() => {
    setGameScreen("multiplayer");
    setMultiplayerSession(null);
  }, []);



  const handleStageSelect = useCallback(
    (stageId: number) => {
      const stage = stageManager.getStage(stageId);
      if (!stage || !stage.unlocked) return;

      setCurrentStage(stage);
      setGameScreen("playing");

      const progress: MissionProgress = {
        type: getMissionType(stage.mission),
        current: 0,
        target: getMissionTarget(stage.mission),
        timeRemaining: stage.timeLimit,
      };
      
      if (stage.id === 4) {
        progress.target = 28;
      }
      
      setMissionProgress(progress);
      setScore(0);
      setIsGameOver(false);
      setFinalScore(0);
      setHoneyJarsCollected(0);
    },
    [stageManager]
  );

  const getMissionType = (mission: string): MissionProgress["type"] => {
    if (mission.includes("Collect")) return "collect";
    if (mission.includes("Collect 1")) return "collect1";
    if (mission.includes("Collect 2")) return "collect2";

    if (mission.includes("Survive")) return "survive";
    if (mission.includes("Reach")) return "reach";
    if (mission.includes("Guide")) return "rescue";
    if (mission.includes("Steal")) return "stealth";
    return "collect";
  };

  const getMissionTarget = (mission: string): number => {
    const match = mission.match(/(\d+)/);
    return match ? Number.parseInt(match[1]) : 10;
  };

  const handlePauseGame = useCallback(() => {
    setGameScreen("paused");
  }, []);

  const handleResumeGame = useCallback(() => {
    setGameScreen("playing");
  }, []);

  const handleMissionComplete = useCallback(
    async (success: boolean) => {
      if (gameScreen !== "playing") return;

      console.log("handleMissionComplete called with success:", success);
      console.log("Current stage:", currentStage);
      console.log("Current stage manager state:", stageManager.getGameState());

      setGameSuccess(success);
      setGameScreen("complete");

      if (success && currentStage && publicKey) {
        // Complete the stage first
        console.log("Completing stage:", currentStage.id);
        stageManager.completeStage(currentStage.id);

        // Get the updated game state after completion
        const updatedGameState = stageManager.getGameState();
        console.log("Updated game state after completion:", updatedGameState);

        // Create a new stage manager with the updated state
        const newStageManager = new StageManager(updatedGameState);
        console.log(
          "New stage manager stages:",
          newStageManager.getStages().map((s) => ({
            id: s.id,
            unlocked: s.unlocked,
            completed: s.completed,
          }))
        );
        setStageManager(newStageManager);

        await solanaGameState.rewardPlayer(
          currentStage.id,
          currentStage.rewards.honey,
          currentStage.rewards.xp
        );

        await saveGameState();
        
        const saveResult = await saveUserProgress({
          walletAddress: publicKey.toBase58(),
          completedStages: updatedGameState.completedStages,
          totalXP: updatedGameState.totalXP,
          totalHoney: updatedGameState.totalHoney,
          currentStage: updatedGameState.currentStage,
        });
        
        if (!saveResult.success) {
          console.error("Failed to save user progress:", saveResult.error);
        } else {
          console.log("Successfully saved user progress to Supabase");
        }
        
        const isPerfect = honeyJarsCollected >= (currentStage.mission.includes("Collect") ? 
          parseInt(currentStage.mission.match(/(\d+)/)?.[1] || "0") : 0);
        
        const stageCompletionResult = await completeStage({
          walletAddress: publicKey.toBase58(),
          stageId: currentStage.id,
          honeyCollected: honeyJarsCollected,
          distance: currentStage.id === 4 ? finalScore : undefined,
          timeElapsed: missionProgress.timeRemaining || 0,
          score: finalScore,
          isPerfect,
        });
        
        if (!stageCompletionResult.success) {
          console.error("Failed to save stage completion:", stageCompletionResult.error);
        } else {
          console.log("Stage completion data saved successfully");
        }

        try {
          const gameResult = {
            success: true,
            honeyCollected: honeyJarsCollected,
            timeElapsed: missionProgress.timeRemaining || 0,
            score: finalScore
          };

          await honeycombBackendService.completeStage(
            publicKey.toBase58(),
            currentStage.id,
            "default-character",
            gameResult
          );
          console.log('Stage completed in Honeycomb!');
        } catch (error) {
          console.error('Failed to complete stage in Honeycomb:', error);
        }

        try {
          const isPerfect = honeyJarsCollected >= (currentStage.mission.includes("Collect") ? 
            parseInt(currentStage.mission.match(/(\d+)/)?.[1] || "0") : 0);
          
          await processLoyaltyRewards(
            currentStage.id,
            honeyJarsCollected,
            missionProgress.timeRemaining || 0,
            isPerfect
          );
          console.log('Loyalty rewards processed!');
          
          const loyaltyUpdateResult = await updateLoyaltyProgress(publicKey.toBase58(), {
            loyaltyTier: loyaltyUser.currentTier,
            loyaltyStreak: loyaltyUser.currentStreak,
            loyaltyLastLogin: loyaltyUser.lastLoginDate,
          });
          
          if (!loyaltyUpdateResult.success) {
            console.error("Failed to save loyalty progress:", loyaltyUpdateResult.error);
          } else {
            console.log("Loyalty progress saved to database");
          }
        } catch (error) {
          console.error('Failed to process loyalty rewards:', error);
        }
      }
    },
    [currentStage, stageManager, solanaGameState, gameScreen, publicKey, honeyJarsCollected, finalScore]
  );

  const handleRetryStage = useCallback(() => {
    if (currentStage) {
      handleStageSelect(currentStage.id);
    }
  }, [currentStage, handleStageSelect]);

  const handleNextStage = useCallback(() => {
    if (currentStage) {
      const nextStageId = currentStage.id + 1;
      const nextStage = stageManager.getStage(nextStageId);
      if (nextStage && nextStage.unlocked) {
        handleStageSelect(nextStageId);
      } else {
        setGameScreen("stage-select");
      }
    }
  }, [currentStage, stageManager, handleStageSelect]);

  const handleBackToLobby = useCallback(() => {
    setGameScreen("lobby");
    setCurrentStage(null);
    saveGameState();
  }, []);

  const handleHoneyJarCollected = useCallback(() => {
    setHoneyJarsCollected((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (gameScreen === "playing" && currentStage) {
      if (currentStage.id >= 1 && currentStage.id <= 3) {
        // Honey collection stages
        setMissionProgress((prev) => ({
          ...prev,
          current: honeyJarsCollected,
        }));

        if (honeyJarsCollected >= missionProgress.target) {
          handleMissionComplete(true);
        }
      } else if (currentStage.id === 4) {
        setMissionProgress((prev) => ({
          ...prev,
          current: score,
        }));
        
        console.log(`Stage 4 Progress: ${score}/${missionProgress.target} rows`);
      }
    }
  }, [
    honeyJarsCollected,
    score,
    gameScreen,
    currentStage,
    missionProgress.target,
    handleMissionComplete,
  ]);

  useEffect(() => {
    if (
      gameScreen === "playing" &&
      missionProgress.timeRemaining !== undefined
    ) {
      const timer = setInterval(() => {
        setMissionProgress((prev) => {
          if (prev.timeRemaining !== undefined && prev.timeRemaining > 0) {
            const newTime = prev.timeRemaining - 1;
            if (newTime === 0) {
              let success = false;
              if (currentStage && currentStage.id >= 1 && currentStage.id <= 3) {
                success = honeyJarsCollected >= prev.target;
              } else if (currentStage && currentStage.id === 4) {
                success = false;
                console.log(`Stage 4: Time ran out! Player reached ${prev.current}/${prev.target} rows`);
              } else {
                success = prev.current >= prev.target;
              }
              setTimeout(() => handleMissionComplete(success), 100);
            }
            return { ...prev, timeRemaining: newTime };
          }
          return prev;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [
    gameScreen,
    handleMissionComplete,
    currentStage,
    honeyJarsCollected,
    missionProgress.target,
  ]);

  useEffect(() => {
    if (isGameOver && gameScreen === "playing") {
      console.log(`Game over triggered for Stage ${currentStage?.id}. Mission complete will be called.`);
      handleMissionComplete(false);
    }
  }, [isGameOver, gameScreen, handleMissionComplete, currentStage]);

  const gameState = stageManager.getGameState();

  return (
    <main className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-gray-800 font-['Press_Start_2P']">
      {showWalletWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded z-50">
          Wallet disconnected! Returning to lobby...
        </div>
      )}

      {gameScreen === "lobby" && (
        <div className="flex flex-col lg:flex-row w-full h-full">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-10 p-4 text-center w-full lg:w-[30%] h-full">
            <h1 className="text-white text-4xl mb-8">Bee Crossy Road</h1>

            {!connected ? (
              <>
                <WalletMultiButton className="!bg-red-500 hover:!bg-red-600 !text-white !font-['Press_Start_2P'] !px-8 !py-4 !rounded-none !shadow-lg mb-4" />
                <p className="text-gray-300 text-sm">
                  Connect your Solana wallet to start playing!
                </p>
              </>
            ) : (
              <div className="space-y-4">
                {!usernameSaved && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="px-4 py-2 rounded text-white border border-blue-500 font-['Press_Start_2P']"
                    />
                    <Button
                      onClick={handleSaveUsername}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-['Press_Start_2P'] px-4 py-2 ml-2"
                    >
                      Save Username
                    </Button>
                    {usernameError && (
                      <div className="text-red-500 mt-2">{usernameError}</div>
                    )}
                  </div>
                )}
                {usernameSaved && (
                  <div>
                    <Button
                      onClick={handleStartGame}
                      className="bg-green-500 hover:bg-green-600 text-white font-['Press_Start_2P'] px-8 py-4 text-xl mb-4"
                    >
                      Play Game
                    </Button>
                    
                    <Button
                      onClick={handleMultiplayerStart}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-['Press_Start_2P'] px-8 py-4 text-xl mb-4"
                    >
                      🐝 Multiplayer Bee Race
                    </Button>
                    

                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <HowToPlay />
            </div>
          </div>
          <div className="w-full h-full hidden lg:block">
            <img
              src={cross}
              className="w-full h-full object-cover"
              alt="Cross Roads"
            />
          </div>
        </div>
      )}
      {gameScreen === "stage-select" && (
        <StageSelect
          stages={(() => {
            const stages = stageManager.getStages();
            console.log(
              "StageSelect - stages being passed:",
              stages.map((s) => ({
                id: s.id,
                name: s.name,
                unlocked: s.unlocked,
                completed: s.completed,
              }))
            );
            return stages;
          })()}
          onStageSelect={handleStageSelect}
          onBackToLobby={handleBackToLobby}
          totalHoney={gameState.totalHoney}
          totalXP={gameState.totalXP}
          username={username}
        />
      )}

      {gameScreen === "playing" && currentStage && (
        <>
          <MissionHUD
            stageName={currentStage.name}
            mission={currentStage.mission}
            progress={missionProgress}
            onPause={handlePauseGame}
          />
          <GameCanvas
            setScore={setScore}
            setGameOver={setIsGameOver}
            setFinalScore={setFinalScore}
            isGameStarted={true}
            isGameOver={isGameOver}
            stageId={currentStage.id}
            onHoneyJarCollected={handleHoneyJarCollected}
          />
          
          {/* Loyalty HUD */}
          {loyaltyUser && loyaltyUser.walletAddress && (
            <LoyaltyHUD
              user={loyaltyUser}
              onRedeemVoucher={handleRedeemVoucher}
              onViewRewards={() => setShowRewardsModal(true)}
            />
          )}
        </>
      )}

      {gameScreen === "paused" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-20">
          <h2 className="text-white text-2xl mb-8">Game Paused</h2>
          <div className="space-y-4 bg-white">
            <Button
              onClick={handleResumeGame}
              className="bg-green-500 hover:bg-green-600 text-white font-['Press_Start_2P'] px-6 py-3"
            >
              Resume
            </Button>
            <Button
              onClick={handleBackToLobby}
              className="font-['Press_Start_2P'] px-6 py-3 bg-transparent hover:bg-gray-700 text-gray-800 border border-gray-600"
            >
              Back to Lobby
            </Button>
          </div>
        </div>
      )}

      {gameScreen === "complete" && currentStage && (
        <GameCompleteModal
          stage={currentStage}
          success={gameSuccess}
          onRetry={handleRetryStage}
          onNextStage={handleNextStage}
          onBackToLobby={handleBackToLobby}
          hasNextStage={!!stageManager.getStage(currentStage.id + 1)?.unlocked}
        />
      )}

      {gameScreen === "multiplayer" && (
        <MultiplayerLobby
          onStartGame={handleMultiplayerGameStart}
          onBack={handleBackToLobby}
        />
      )}



      {gameScreen === "multiplayer-racing" && multiplayerSession && (
        <MultiplayerRacingCanvas
          key={`${multiplayerSession.code}-${multiplayerSession.isHost}`}
          sessionCode={multiplayerSession.code}
          isHost={multiplayerSession.isHost}
          onGameEnd={handleMultiplayerGameEnd}
          onBackToLobby={handleBackToMultiplayerLobby}
        />
      )}

      {/* Rewards Modal */}
      {loyaltyUser && loyaltyUser.walletAddress && (
        <RewardsModal
          isOpen={showRewardsModal}
          onClose={() => setShowRewardsModal(false)}
          user={loyaltyUser}
          onRedeemVoucher={handleRedeemVoucher}
        />
      )}
    </main>
  );
}
