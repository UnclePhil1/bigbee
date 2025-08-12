export interface Stage {
  id: number
  name: string
  description: string
  mission: string
  difficulty: "Easy" | "Medium" | "Hard" | "Very Hard"
  timeLimit?: number
  unlocked: boolean
  completed: boolean
  rewards: {
    honey: number
    xp: number
  }
}

export interface GameState {
  currentStage: number
  completedStages: number[]
  totalHoney: number
  totalXP: number
  powerUps: string[]
}

export interface MissionProgress {
  type: "collect" | "collect1" | "collect2" | "survive" | "reach" | "rescue" | "stealth"
  current: number
  target: number
  timeRemaining?: number
}

export interface PlayerData {
  wallet: string
  gameState: GameState
  lastPlayed: number
}
