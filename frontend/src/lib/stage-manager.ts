import type { Stage, GameState } from "@/types/game-types";

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "Honey Rush",
    description: "Collect honey jars while avoiding traffic",
    mission: "Collect 4 honey jars in 60 seconds",
    difficulty: "Easy",
    timeLimit: 60,
    unlocked: true,
    completed: false,
    rewards: { honey: 100, xp: 50 },
  },
  {
    id: 2,
    name: "Honey Rush",
    description: "Collect honey jars while avoiding traffic",
    mission: "Collect 7 honey jars in 90 seconds",
    difficulty: "Medium",
    timeLimit: 90,
    unlocked: false,
    completed: false,
    rewards: { honey: 200, xp: 100 },
  },
  {
    id: 3,
    name: "Honey Rush",
    description: "Collect honey jars while avoiding traffic",
    mission: "Collect 10 honey jars in 120 seconds",
    difficulty: "Hard",
    timeLimit: 120,
    unlocked: false,
    completed: false,
    rewards: { honey: 300, xp: 200 },
  },
  {
    id: 4,
    name: "Timed Dash",
    description: "Race against time to reach the finish",
    mission: "Reach the finish line in 45 seconds",
    difficulty: "Medium",
    timeLimit: 45,
    unlocked: false,
    completed: false,
    rewards: { honey: 200, xp: 100 },
  },
  {
    id: 5,
    name: "Wasp Escape",
    description: "Survive the wasp chase!",
    mission: "Survive for 30 seconds while being chased",
    difficulty: "Hard",
    timeLimit: 30,
    unlocked: false,
    completed: false,
    rewards: { honey: 300, xp: 200 },
  },
  {
    id: 6,
    name: "Rescue Mission",
    description: "Guide lost bees to safety",
    mission: "Guide 3 lost bees to the safe zone",
    difficulty: "Medium",
    unlocked: false,
    completed: false,
    rewards: { honey: 250, xp: 150 },
  },
  {
    id: 7,
    name: "Honey Heist",
    description: "Steal honey while avoiding guards",
    mission: "Collect honey while avoiding guard wasps",
    difficulty: "Very Hard",
    timeLimit: 90,
    unlocked: false,
    completed: false,
    rewards: { honey: 500, xp: 400 },
  },
];

export class StageManager {
  private stages: Stage[];
  private gameState: GameState;

  constructor(gameState?: GameState) {
    this.gameState = gameState || {
      currentStage: 1,
      completedStages: [],
      totalHoney: 0,
      totalXP: 0,
      powerUps: [],
    };
    
    // Create stages with proper state
    this.stages = STAGES.map(stage => ({
      ...stage,
      unlocked: false,
      completed: false
    }));
    
    this.updateStageUnlocks();
  }

  private updateStageUnlocks() {
    this.stages.forEach((stage, index) => {
      if (index === 0) {
        stage.unlocked = true;
      } else {
        const prevStageId = this.stages[index - 1].id;
        stage.unlocked = this.gameState.completedStages.includes(prevStageId);
      }
      stage.completed = this.gameState.completedStages.includes(stage.id);
    });
  }

  getStages(): Stage[] {
    return [...this.stages];
  }

  getStage(id: number): Stage | undefined {
    return this.stages.find((stage) => stage.id === id);
  }

  completeStage(stageId: number): boolean {
    const stage = this.getStage(stageId);
    if (!stage) return false;

    if (!stage.completed) {
      if (!this.gameState.completedStages.includes(stageId)) {
        this.gameState.completedStages.push(stageId);
      }

      this.gameState.totalHoney += stage.rewards.honey;
      this.gameState.totalXP += stage.rewards.xp;

      stage.completed = true;

      // Update the current stage to the next stage
      this.gameState.currentStage = stageId + 1;

      // Update stage unlocks after modifying the game state
      this.updateStageUnlocks();
      return true;
    }

    return false;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  setGameState(gameState: GameState) {
    this.gameState = gameState;
    this.updateStageUnlocks();
  }
}
