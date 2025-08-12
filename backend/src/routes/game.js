import express from 'express';
import honeycombService from '../services/honeycombService.js';

const router = express.Router();

// Game mission configurations
const GAME_MISSIONS = {
  stage1: {
    name: "Honey Rush - Stage 1",
    description: "Collect 4 honey jars in 60 seconds",
    duration: 60,
    targetAmount: 4,
    resourceType: "honey",
    rewardXP: 50,
    rewardHoney: 100,
  },
  stage2: {
    name: "Honey Rush - Stage 2", 
    description: "Collect 7 honey jars in 90 seconds",
    duration: 90,
    targetAmount: 7,
    resourceType: "honey",
    rewardXP: 100,
    rewardHoney: 200,
  },
  stage3: {
    name: "Honey Rush - Stage 3",
    description: "Collect 10 honey jars in 120 seconds", 
    duration: 120,
    targetAmount: 10,
    resourceType: "honey",
    rewardXP: 200,
    rewardHoney: 300,
  },
  stage4: {
    name: "Timed Dash",
    description: "Reach the finish line in 45 seconds",
    duration: 45,
    targetAmount: 1,
    resourceType: "distance",
    rewardXP: 100,
    rewardHoney: 200,
  },
  stage5: {
    name: "Wasp Escape",
    description: "Survive for 30 seconds while being chased",
    duration: 30,
    targetAmount: 1,
    resourceType: "survival",
    rewardXP: 200,
    rewardHoney: 300,
  },
  stage6: {
    name: "Rescue Mission",
    description: "Guide 3 lost bees to the safe zone",
    duration: 0, // No time limit
    targetAmount: 3,
    resourceType: "rescue",
    rewardXP: 150,
    rewardHoney: 250,
  },
  stage7: {
    name: "Honey Heist",
    description: "Collect honey while avoiding guard wasps",
    duration: 90,
    targetAmount: 1,
    resourceType: "stealth",
    rewardXP: 400,
    rewardHoney: 500,
  },
};

// Initialize game missions (create all missions in Honeycomb)
router.post('/init-missions', async (req, res) => {
  try {
    const createdMissions = [];
    
    for (const [stageKey, missionConfig] of Object.entries(GAME_MISSIONS)) {
      try {
        const mission = await honeycombService.createMission(missionConfig);
        createdMissions.push({
          stageKey,
          missionId: mission.mission.address,
          ...missionConfig
        });
        console.log(`Created mission for ${stageKey}:`, mission.mission.address);
      } catch (error) {
        console.error(`Error creating mission for ${stageKey}:`, error);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Created ${createdMissions.length} missions`,
      missions: createdMissions 
    });
  } catch (error) {
    console.error('Error initializing game missions:', error);
    res.status(500).json({ error: error.message });
  }
});





router.post('/stage/complete', async (req, res) => {
  try {
    const { walletAddress, stageId, characterId, gameResult } = req.body;
    
    if (!walletAddress || !stageId) {
      return res.status(400).json({ error: 'Wallet address and stage ID are required' });
    }

    const stageKey = `stage${stageId}`;
    const missionConfig = GAME_MISSIONS[stageKey];
    
    if (!missionConfig) {
      return res.status(404).json({ error: `Stage ${stageId} not found` });
    }

    console.log(`Stage ${stageId} completed by ${walletAddress}`);
    console.log(`Game result:`, gameResult);
    
    // Calculate rewards
    const rewards = gameResult.success ? {
      xp: missionConfig.rewardXP,
      honey: missionConfig.rewardHoney
    } : null;

    if (rewards) {
      console.log(`Rewards earned: ${rewards.xp} XP, ${rewards.honey} honey`);
    }
    
    res.json({ 
      success: true, 
      stageId: parseInt(stageId),
      missionConfig,
      rewards,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing game stage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player progress
router.get('/progress/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Simple progress tracking - no complex Honeycomb integration
    console.log(`Getting progress for ${walletAddress}`);
    
    res.json({ 
      success: true, 
      walletAddress,
      totalStages: Object.keys(GAME_MISSIONS).length,
      availableStages: Object.keys(GAME_MISSIONS).map(key => ({
        stageId: key.replace('stage', ''),
        name: GAME_MISSIONS[key].name,
        description: GAME_MISSIONS[key].description
      }))
    });
  } catch (error) {
    console.error('Error getting player progress:', error);
    res.status(500).json({ error: error.message });
  }
});



// Get available stages/missions
router.get('/stages', async (req, res) => {
  try {
    const missions = await honeycombService.getAllMissions();
    
    const stages = Object.entries(GAME_MISSIONS).map(([stageKey, config]) => {
      // Ensure missions is an array and find the matching mission
      const mission = Array.isArray(missions) ? missions.find(m => m.name === config.name) : null;
      return {
        stageId: parseInt(stageKey.replace('stage', '')),
        ...config,
        missionId: mission?.address || null,
        isAvailable: !!mission
      };
    });
    
    res.json({ 
      success: true, 
      stages: stages.sort((a, b) => a.stageId - b.stageId)
    });
  } catch (error) {
    console.error('Error getting stages:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
