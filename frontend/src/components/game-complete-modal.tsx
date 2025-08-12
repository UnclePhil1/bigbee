import type { Stage } from "@/types/game-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Star, Coins, CheckCircle, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GameCompleteModalProps {
  stage: Stage
  success: boolean
  onRetry: () => void
  onNextStage: () => void
  onBackToLobby: () => void
  hasNextStage: boolean
}

export function GameCompleteModal({
  stage,
  success,
  onRetry,
  onNextStage,
  onBackToLobby,
  hasNextStage,
}: GameCompleteModalProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-30">
      <Card className="w-96 mx-4 bg-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {success ? (
              <div className="relative">
                <Trophy className="w-16 h-16 text-yellow-500" />
                <CheckCircle className="w-6 h-6 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl">
                ✗
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-['Press_Start_2P']">
            {success ? "Mission Complete!" : "Mission Failed"}
          </CardTitle>
          <CardDescription className="text-lg">{stage.name}</CardDescription>
          {success && (
            <div className="mt-2">
              <Badge className="bg-green-500 text-white px-3 py-1 text-sm font-bold flex items-center gap-1 mx-auto w-fit">
                <CheckCircle className="w-4 h-4" />
                COMPLETED
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {success && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold mb-2 text-green-800">🎉 Rewards Earned:</h3>
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold">{stage.rewards.honey} HONEY</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">{stage.rewards.xp} XP</span>
                </div>
              </div>
              {hasNextStage && (
                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-700 font-semibold">
                    🚀 Next mission unlocked!
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!success && (
              <Button onClick={onRetry} className="bg-blue-500 hover:bg-blue-600 text-white font-['Press_Start_2P']">
                Retry Mission
              </Button>
            )}

            {success && hasNextStage && (
              <Button
                onClick={onNextStage}
                className="bg-green-500 hover:bg-green-600 text-white font-['Press_Start_2P'] flex items-center gap-2"
              >
                <span>Next Mission</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {success && !hasNextStage && (
              <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-yellow-700 font-semibold">
                  🏆 Congratulations! You've completed all missions!
                </p>
              </div>
            )}

            <Button onClick={onBackToLobby} variant="outline" className="font-['Press_Start_2P'] bg-transparent">
              Back to Mission Select
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

