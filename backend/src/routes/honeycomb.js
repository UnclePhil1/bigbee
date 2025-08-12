import express from 'express';
import honeycombService from '../services/honeycombService.js';

const router = express.Router();

router.post('/project/init', async (req, res) => {
  try {
    const project = await honeycombService.getOrCreateProject();
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error initializing project:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/user', async (req, res) => {
  try {
    const { walletAddress, username } = req.body;
    
    if (!walletAddress || !username) {
      return res.status(400).json({ error: 'Wallet address and username are required' });
    }

    const user = await honeycombService.createUser(walletAddress, username);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user data
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await honeycombService.getUserData(walletAddress);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create character
router.post('/character', async (req, res) => {
  try {
    const { walletAddress, characterName, traits } = req.body;
    
    if (!walletAddress || !characterName) {
      return res.status(400).json({ error: 'Wallet address and character name are required' });
    }

    const character = await honeycombService.createCharacter(walletAddress, characterName, traits || {});
    res.json({ success: true, character });
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get character data
router.get('/character/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const character = await honeycombService.getCharacterData(characterId);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json({ success: true, character });
  } catch (error) {
    console.error('Error getting character data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create mission
router.post('/mission', async (req, res) => {
  try {
    const missionConfig = req.body;
    
    if (!missionConfig.name || !missionConfig.description) {
      return res.status(400).json({ error: 'Mission name and description are required' });
    }

    const mission = await honeycombService.createMission(missionConfig);
    res.json({ success: true, mission });
  } catch (error) {
    console.error('Error creating mission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get mission data
router.get('/mission/:missionId', async (req, res) => {
  try {
    const { missionId } = req.params;
    const mission = await honeycombService.getMissionData(missionId);
    
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    res.json({ success: true, mission });
  } catch (error) {
    console.error('Error getting mission data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all missions
router.get('/missions', async (req, res) => {
  try {
    const missions = await honeycombService.getAllMissions();
    res.json({ success: true, missions });
  } catch (error) {
    console.error('Error getting all missions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start mission
router.post('/mission/start', async (req, res) => {
  try {
    const { walletAddress, missionId, characterId } = req.body;
    
    if (!walletAddress || !missionId || !characterId) {
      return res.status(400).json({ error: 'Wallet address, mission ID, and character ID are required' });
    }

    const result = await honeycombService.startMission(walletAddress, missionId, characterId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error starting mission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete mission
router.post('/mission/complete', async (req, res) => {
  try {
    const { walletAddress, missionId, characterId, result } = req.body;
    
    if (!walletAddress || !missionId || !characterId) {
      return res.status(400).json({ error: 'Wallet address, mission ID, and character ID are required' });
    }

    const missionResult = await honeycombService.completeMission(walletAddress, missionId, characterId, result);
    res.json({ success: true, result: missionResult });
  } catch (error) {
    console.error('Error completing mission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mine resource
router.post('/resource/mine', async (req, res) => {
  try {
    const { walletAddress, resourceType, amount } = req.body;
    
    if (!walletAddress || !resourceType || amount === undefined) {
      return res.status(400).json({ error: 'Wallet address, resource type, and amount are required' });
    }

    const result = await honeycombService.mineResource(walletAddress, resourceType, amount);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error mining resource:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
