import { supabase } from "./supabaseClient";

export interface UserProgress {
  walletAddress: string;
  completedStages: number[];
  currentStage: number;
  totalStagesCompleted: number;
  totalXP: number;
  totalHoney: number;
  totalScore: number;
  stage1Honey: number;
  stage2Honey: number;
  stage3Honey: number;
  stage4Distance: number;
  loyaltyTier: string;
  loyaltyStreak: number;
  loyaltyLastLogin: string;
  perfectScores: number;
  totalPlayTime: number;
  fastestCompletionTimes: Record<string, number>;
  lastPlayed: string;
  totalSessions: number;
}

export interface StageCompletionData {
  walletAddress: string;
  stageId: number;
  honeyCollected: number;
  distance?: number;
  timeElapsed: number;
  score: number;
  isPerfect: boolean;
}

export const loadUserProgress = async (walletAddress: string): Promise<UserProgress | null> => {
  try {
    console.log("Loading user progress for wallet:", walletAddress);
    
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (error) {
      console.error("Error loading user progress:", error);
      return null;
    }

    if (!data) {
      console.log("No user progress found, creating new record");
      return await createUserProgress(walletAddress);
    }

    // Transform database data to interface format
    const userProgress: UserProgress = {
      walletAddress: data.wallet_address,
      completedStages: data.completed_stages || [],
      currentStage: data.current_stage || 1,
      totalStagesCompleted: data.total_stages_completed || 0,
      totalXP: data.total_xp || 0,
      totalHoney: data.total_honey || 0,
      totalScore: data.total_score || 0,
      stage1Honey: data.stage_1_honey || 0,
      stage2Honey: data.stage_2_honey || 0,
      stage3Honey: data.stage_3_honey || 0,
      stage4Distance: data.stage_4_distance || 0,
      loyaltyTier: data.loyalty_tier || 'Honey Bee',
      loyaltyStreak: data.loyalty_streak || 0,
      loyaltyLastLogin: data.loyalty_last_login || new Date().toISOString(),
      perfectScores: data.perfect_scores || 0,
      totalPlayTime: data.total_play_time || 0,
      fastestCompletionTimes: data.fastest_completion_times || {},
      lastPlayed: data.last_played || new Date().toISOString(),
      totalSessions: data.total_sessions || 0,
    };

    console.log("Loaded user progress:", userProgress);
    return userProgress;
  } catch (error) {
    console.error("Failed to load user progress:", error);
    return null;
  }
};

export const createUserProgress = async (walletAddress: string): Promise<UserProgress | null> => {
  try {
    console.log("Creating new user progress for wallet:", walletAddress);
    
    const { error } = await supabase
      .from("user_progress")
      .insert([
        {
          wallet_address: walletAddress,
          completed_stages: [],
          current_stage: 1,
          total_stages_completed: 0,
          total_xp: 0,
          total_honey: 0,
          total_score: 0,
          stage_1_honey: 0,
          stage_2_honey: 0,
          stage_3_honey: 0,
          stage_4_distance: 0,
          loyalty_tier: 'Honey Bee',
          loyalty_streak: 0,
          loyalty_last_login: new Date().toISOString(),
          perfect_scores: 0,
          total_play_time: 0,
          fastest_completion_times: {},
          last_played: new Date().toISOString(),
          total_sessions: 0,
        }
      ]);

    if (error) {
      console.error("Error creating user progress:", error);
      return null;
    }

    return await loadUserProgress(walletAddress);
  } catch (error) {
    console.error("Failed to create user progress:", error);
    return null;
  }
};

export const saveUserProgress = async (progress: Partial<UserProgress>): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Saving user progress:", progress);
    
    if (!progress.walletAddress) {
      throw new Error("Wallet address is required");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map interface properties to database columns
    if (progress.completedStages !== undefined) {
      updateData.completed_stages = progress.completedStages;
      updateData.total_stages_completed = progress.completedStages.length;
    }
    if (progress.currentStage !== undefined) updateData.current_stage = progress.currentStage;
    if (progress.totalXP !== undefined) updateData.total_xp = progress.totalXP;
    if (progress.totalHoney !== undefined) updateData.total_honey = progress.totalHoney;
    if (progress.totalScore !== undefined) updateData.total_score = progress.totalScore;
    if (progress.stage1Honey !== undefined) updateData.stage_1_honey = progress.stage1Honey;
    if (progress.stage2Honey !== undefined) updateData.stage_2_honey = progress.stage2Honey;
    if (progress.stage3Honey !== undefined) updateData.stage_3_honey = progress.stage3Honey;
    if (progress.stage4Distance !== undefined) updateData.stage_4_distance = progress.stage4Distance;
    if (progress.loyaltyTier !== undefined) updateData.loyalty_tier = progress.loyaltyTier;
    if (progress.loyaltyStreak !== undefined) updateData.loyalty_streak = progress.loyaltyStreak;
    if (progress.loyaltyLastLogin !== undefined) updateData.loyalty_last_login = progress.loyaltyLastLogin;
    if (progress.perfectScores !== undefined) updateData.perfect_scores = progress.perfectScores;
    if (progress.totalPlayTime !== undefined) updateData.total_play_time = progress.totalPlayTime;
    if (progress.fastestCompletionTimes !== undefined) updateData.fastest_completion_times = progress.fastestCompletionTimes;
    if (progress.lastPlayed !== undefined) updateData.last_played = progress.lastPlayed;
    if (progress.totalSessions !== undefined) updateData.total_sessions = progress.totalSessions;

    const { error } = await supabase
      .from("user_progress")
      .update(updateData)
      .eq("wallet_address", progress.walletAddress);

    if (error) {
      console.error("Error saving user progress:", error);
      return { success: false, error: error.message };
    }

    console.log("User progress saved successfully");
    return { success: true };
  } catch (error) {
    console.error("Failed to save user progress:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const completeStage = async (completionData: StageCompletionData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Completing stage:", completionData);
    
    // First, get current user progress
    const currentProgress = await loadUserProgress(completionData.walletAddress);
    if (!currentProgress) {
      return { success: false, error: "User progress not found" };
    }

    // Update stage-specific statistics
    const stageUpdates: Partial<UserProgress> = {
      walletAddress: completionData.walletAddress,
      lastPlayed: new Date().toISOString(),
      totalSessions: currentProgress.totalSessions + 1,
      totalPlayTime: currentProgress.totalPlayTime + completionData.timeElapsed,
    };

    // Update stage-specific data
    switch (completionData.stageId) {
      case 1:
        stageUpdates.stage1Honey = Math.max(currentProgress.stage1Honey, completionData.honeyCollected);
        break;
      case 2:
        stageUpdates.stage2Honey = Math.max(currentProgress.stage2Honey, completionData.honeyCollected);
        break;
      case 3:
        stageUpdates.stage3Honey = Math.max(currentProgress.stage3Honey, completionData.honeyCollected);
        break;
      case 4:
        stageUpdates.stage4Distance = Math.max(currentProgress.stage4Distance, completionData.distance || 0);
        break;
    }

    // Update completion times if it's a new record
    const fastestTimes = { ...currentProgress.fastestCompletionTimes };
    const stageKey = `stage_${completionData.stageId}`;
    const currentBest = fastestTimes[stageKey] || Infinity;
    if (completionData.timeElapsed < currentBest) {
      fastestTimes[stageKey] = completionData.timeElapsed;
      stageUpdates.fastestCompletionTimes = fastestTimes;
    }

    // Update perfect scores
    if (completionData.isPerfect) {
      stageUpdates.perfectScores = currentProgress.perfectScores + 1;
    }

    // Save the updated progress
    const result = await saveUserProgress(stageUpdates);
    
    if (result.success) {
      console.log("Stage completion saved successfully");
    }
    
    return result;
  } catch (error) {
    console.error("Failed to complete stage:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const updateLoyaltyProgress = async (
  walletAddress: string, 
  loyaltyData: Partial<Pick<UserProgress, 'loyaltyTier' | 'loyaltyStreak' | 'loyaltyLastLogin'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Updating loyalty progress:", loyaltyData);
    
    const updateData: Partial<UserProgress> = {
      walletAddress,
      ...loyaltyData,
    };

    return await saveUserProgress(updateData);
  } catch (error) {
    console.error("Failed to update loyalty progress:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};