import type { MissionProgress } from "@/types/game-types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Pause, Target, Clock, Users, Shield, CheckCircle } from "lucide-react"

interface MissionHUDProps {
  stageName: string
  mission: string
  progress: MissionProgress
  onPause: () => void
}

export function MissionHUD({ stageName, mission, progress, onPause }: MissionHUDProps) {
  const getMissionIcon = () => {
    switch (progress.type) {
      case "collect":
        return <Target className="w-3 h-3" />
      case "collect1":
        return <Target className="w-3 h-3" />
      case "collect2":
        return <Target className="w-3 h-3" />
      case "survive":
        return <Shield className="w-3 h-3" />
      case "reach":
        return <Clock className="w-3 h-3" />
      case "rescue":
        return <Users className="w-3 h-3" />
      case "stealth":
        return <Shield className="w-3 h-3" />
      default:
        return <Target className="w-3 h-3" />
    }
  }

  const getProgressPercentage = () => {
    return (progress.current / progress.target) * 100
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isMissionComplete = progress.current >= progress.target

  return (
    <div className="absolute top-2 left-2 right-2 z-20">
      <div className={`bg-black bg-opacity-80 rounded-md p-2 text-white font-['Press_Start_2P'] max-w-md mx-auto ${isMissionComplete ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-sm mb-1">{stageName}</h2>
            <p className="text-xs text-gray-300">{mission}</p>
            {isMissionComplete && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-bold">MISSION COMPLETE!</span>
              </div>
            )}
          </div>
          <Button onClick={onPause} size="sm" className="bg-gray-700 hover:bg-gray-600 h-6 w-6 p-0">
            <Pause className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {getMissionIcon()}
            <span className={`text-xs ${isMissionComplete ? 'text-green-400 font-bold' : ''}`}>
              {progress.current}/{progress.target}
            </span>
            {isMissionComplete && (
              <CheckCircle className="w-3 h-3 text-green-400" />
            )}
          </div>

          <div className="flex-1">
            <Progress 
              value={getProgressPercentage()} 
              className={`h-1.5 ${isMissionComplete ? 'bg-green-500' : ''}`}
            />
          </div>

          {progress.timeRemaining !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className={`text-xs ${isMissionComplete ? 'text-green-400 font-bold' : ''}`}>
                {formatTime(progress.timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
