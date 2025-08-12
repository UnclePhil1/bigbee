import type { Stage } from "@/types/game-types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Trophy, Clock, Target, CheckCircle } from "lucide-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

interface StageSelectProps {
  stages: Stage[];
  onStageSelect: (stageId: number) => void;
  onBackToLobby: () => void;
  totalHoney: number;
  totalXP: number;
  username?: string;
}

export function StageSelect({
  stages,
  onStageSelect,
  onBackToLobby,
  totalHoney,
  totalXP,
  username,
}: StageSelectProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "Hard":
        return "bg-orange-500";
      case "Very Hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };                                                                                                                                                                                                                                                                                              

  const getMissionIcon = (mission: string) => {
    if (mission.includes("Collect")) return <Target className="w-4 h-4" />;
    if (mission.includes("Reach")) return <Clock className="w-4 h-4" />;
    if (mission.includes("Survive")) return <Trophy className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  const { publicKey } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toBase58());
    }
  }, [publicKey]);

  const { disconnect } = useWallet();

  return (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-95 z-10 p-4 overflow-y-auto">
      <nav className="w-full flex justify-between items-center px-4 py-2 bg-gray-800 rounded mb-6">
        <div className="flex items-center gap-6">
          <span className="text-white font-['Press_Start_2P'] text-sm">
            {username ? `👤 ${username}` : "👤 Guest"}
          </span>
          {walletAddress && (
            <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          )}
        </div>
        <WalletDisconnectButton
          className="!bg-red-600 hover:!bg-red-700 !text-white !font-['Press_Start_2P'] !px-4 !py-2 !rounded"
          onClick={() => {
            disconnect();
            onBackToLobby();
          }}
        />
      </nav>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white text-3xl font-['Press_Start_2P']">
            Select Stage
          </h1>
          <div className="flex gap-4 text-white text-sm">
            <div>🍯 {totalHoney} HONEY</div>
            <div>⭐ {totalXP} XP</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {stages.map((stage) => (
            <Card key={stage.id} className={`relative bg-white ${stage.completed ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}>
              {/* Completed Badge */}
              {stage.completed && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-green-500 text-white px-2 py-1 text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    COMPLETED
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getMissionIcon(stage.mission)}
                    {stage.name}
                    {stage.completed && (
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    )}
                  </CardTitle>
                  {!stage.unlocked && !stage.completed && (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge
                    className={`${getDifficultyColor(
                      stage.difficulty
                    )} text-white w-fit`}
                  >
                    {stage.difficulty}
                  </Badge>
                  {stage.completed && (
                    <Badge className="bg-green-100 text-green-800 w-fit text-xs">
                      ✓ Done
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  {stage.description}
                </CardDescription>
                <div className="text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3" />
                    {stage.mission}
                  </div>
                  {stage.timeLimit && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {stage.timeLimit}s time limit
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Rewards: 🍯 {stage.rewards.honey} • ⭐ {stage.rewards.xp}
                </div>
                <Button
                  className={`mt-4 w-full font-['Press_Start_2P'] ${
                    stage.completed
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : stage.unlocked
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed"
                  }`}
                  onClick={() => (stage.unlocked || stage.completed) && onStageSelect(stage.id)}
                  disabled={!stage.unlocked && !stage.completed}
                >
                  {stage.completed ? "Replay Stage" : "Start Stage"}
                </Button>
                {!stage.unlocked && !stage.completed && (
                  <div className="text-xs text-red-500 mt-2">
                    Complete previous stage to unlock
                  </div>
                )}
                {stage.completed && (
                  <div className="text-xs text-green-600 mt-2 font-semibold">
                    ✓ Mission accomplished! You can replay or continue to next stage.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onBackToLobby}
            className="bg-gray-700 hover:bg-gray-600 text-white font-['Press_Start_2P'] px-6 py-3"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
