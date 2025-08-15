// Service to communicate with the CrossRoad Honeycomb backend
import { config } from '../config/environment';

const BACKEND_URL = config.backendUrl;

export interface GameResult {
  success: boolean;
  honeyCollected: number;
  timeElapsed: number;
  score: number;
}

export interface MissionConfig {
  name: string;
  description: string;
  duration: number;
  targetAmount: number;
  resourceType: string;
  rewardXP: number;
  rewardHoney: number;
}

export interface Stage {
  stageId: number;
  name: string;
  description: string;
  duration: number;
  targetAmount: number;
  resourceType: string;
  rewardXP: number;
  rewardHoney: number;
  missionId: string | null;
  isAvailable: boolean;
}

export interface UserProgress {
  user: any;
  completedMissions: any[];
  totalStages: number;
}

class HoneycombBackendService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Initialize Honeycomb project
  async initializeProject() {
    return this.makeRequest('/api/honeycomb/project/init', {
      method: 'POST',
    });
  }

  // Initialize game missions
  async initializeMissions() {
    return this.makeRequest('/api/game/init-missions', {
      method: 'POST',
    });
  }

  // Create user
  async createUser(walletAddress: string, username: string) {
    return this.makeRequest('/api/honeycomb/user', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, username }),
    });
  }

  // Get user data
  async getUserData(walletAddress: string) {
    return this.makeRequest(`/api/honeycomb/user/${walletAddress}`);
  }



  // Get all stages/missions
  async getStages(): Promise<{ success: boolean; stages: Stage[] }> {
    return this.makeRequest('/api/game/stages');
  }

  // Start a game stage
  async startStage(walletAddress: string, stageId: number) {
    return this.makeRequest('/api/game/stage/start', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, stageId }),
    });
  }

  // Complete a game stage
  async completeStage(
walletAddress: string, stageId: number, p0: string, gameResult: GameResult  ) {
    return this.makeRequest('/api/game/stage/complete', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, stageId, gameResult }),
    });
  }

  // Get player progress
  async getPlayerProgress(walletAddress: string): Promise<{ success: boolean; data: UserProgress }> {
    return this.makeRequest(`/api/game/progress/${walletAddress}`);
  }

  // Get user profile
  async getUserProfile(walletAddress: string) {
    return this.makeRequest(`/api/user/profile/${walletAddress}`);
  }



  // Get user's resources
  async getUserResources(walletAddress: string) {
    return this.makeRequest(`/api/user/resources/${walletAddress}`);
  }

  // Get user's mission history
  async getUserMissionHistory(walletAddress: string) {
    return this.makeRequest(`/api/user/missions/${walletAddress}`);
  }

  // Get user's achievements
  async getUserAchievements(walletAddress: string) {
    return this.makeRequest(`/api/user/achievements/${walletAddress}`);
  }

  // Mine resource
  async mineResource(walletAddress: string, resourceType: string, amount: number) {
    return this.makeRequest('/api/honeycomb/resource/mine', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, resourceType, amount }),
    });
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }
}

export const honeycombBackendService = new HoneycombBackendService();
