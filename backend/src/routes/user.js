import express from 'express';
import honeycombService from '../services/honeycombService.js';

const router = express.Router();

// Get user profile
router.get('/profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await honeycombService.getUserData(walletAddress);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Note: This would need to be implemented based on Honeycomb's user update functionality
    // For now, we'll return a placeholder response
    res.json({ 
      success: true, 
      message: 'User profile updated successfully',
      user: { walletAddress, username }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's characters
router.get('/characters/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Get all characters and filter by user
    const characters = await honeycombService.getAllCharacters();
    const userCharacters = characters.filter(c => c.authority === walletAddress);
    
    res.json({ 
      success: true, 
      characters: userCharacters 
    });
  } catch (error) {
    console.error('Error getting user characters:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's resources
router.get('/resources/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Note: This would need to be implemented based on Honeycomb's resource tracking
    // For now, we'll return placeholder data
    const resources = {
      honey: 0,
      xp: 0,
      pollen: 0
    };
    
    res.json({ 
      success: true, 
      resources 
    });
  } catch (error) {
    console.error('Error getting user resources:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's mission history
router.get('/missions/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Note: This would need to be implemented based on Honeycomb's mission history tracking
    // For now, we'll return placeholder data
    const missionHistory = [];
    
    res.json({ 
      success: true, 
      missionHistory 
    });
  } catch (error) {
    console.error('Error getting user mission history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's achievements
router.get('/achievements/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Note: This would need to be implemented based on Honeycomb's achievement system
    // For now, we'll return placeholder data
    const achievements = [
      {
        id: 'first_mission',
        name: 'First Mission',
        description: 'Complete your first mission',
        unlocked: false,
        icon: '🎯'
      },
      {
        id: 'honey_collector',
        name: 'Honey Collector',
        description: 'Collect 100 honey',
        unlocked: false,
        icon: '🍯'
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a mission in under 30 seconds',
        unlocked: false,
        icon: '⚡'
      }
    ];
    
    res.json({ 
      success: true, 
      achievements 
    });
  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
