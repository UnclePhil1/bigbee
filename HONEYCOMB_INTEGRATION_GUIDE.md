# CrossRoad Game - Honeycomb Protocol Integration Guide

This guide will help you set up and integrate Honeycomb Protocol into your CrossRoad game, enabling missions, traits, and progression logic.

## 🎯 What We've Built

### Frontend Integration
- **Honeycomb Client** (`src/lib/honeycombClient.ts`) - Direct Honeycomb Protocol integration
- **Backend Service** (`src/lib/honeycombBackendService.ts`) - API communication with backend
- **Mission System** - 7 predefined game stages with Honeycomb missions
- **Character System** - Bee characters with traits and rarity
- **Resource Management** - Honey, XP, and pollen tracking

### Backend API
- **Express Server** with Honeycomb Protocol integration
- **Mission Management** - Create, start, and complete missions
- **Character Management** - Create and manage bee characters
- **Resource Mining** - On-chain resource rewards
- **User Progress** - Track player advancement

## 🚀 Quick Setup

### 1. Frontend Setup

```bash
# Install Honeycomb dependencies
npm install @honeycomb-protocol/edge-client bs58

# Add backend URL to your .env file
echo "VITE_BACKEND_URL=http://localhost:3001" >> .env
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run setup script (creates .env and admin keypair)
node setup.js

# Install dependencies
npm install

# Start the backend
npm run dev
```

### 3. Initialize Honeycomb Integration

```bash
# Initialize the Honeycomb project
curl -X POST http://localhost:3001/api/honeycomb/project/init

# Initialize all game missions
curl -X POST http://localhost:3001/api/game/init-missions
```

## 🎮 Game Integration

### Mission System

The game now has 7 stages that integrate with Honeycomb missions:

1. **Stage 1**: Honey Rush - Collect 4 honey jars in 60 seconds
2. **Stage 2**: Honey Rush - Collect 7 honey jars in 90 seconds  
3. **Stage 3**: Honey Rush - Collect 10 honey jars in 120 seconds
4. **Stage 4**: Timed Dash - Reach finish line in 45 seconds
5. **Stage 5**: Wasp Escape - Survive for 30 seconds
6. **Stage 6**: Rescue Mission - Guide 3 lost bees
7. **Stage 7**: Honey Heist - Stealth honey collection

### Character Traits

Bee characters have randomized traits:
- **Speed** (1-10): Movement speed
- **Agility** (1-10): Maneuverability  
- **Honey Capacity** (1-10): Maximum honey storage
- **Stamina** (1-10): Endurance
- **Luck** (1-10): Random chance bonuses
- **Rarity**: common, uncommon, or rare

### Resource System

- **Honey**: Primary game currency (mined on-chain)
- **XP**: Experience points for progression
- **Pollen**: Secondary resource

## 🔧 Integration Points

### 1. Stage Completion

Replace the current stage completion logic in `App.tsx`:

```typescript
// Old Supabase logic
await saveUserProgress({...});

// New Honeycomb logic
const gameResult = {
  success: true,
  honeyCollected: honeyJarsCollected,
  timeElapsed: missionProgress.timeRemaining || 0,
  score: finalScore
};

await honeycombBackendService.completeStage(
  publicKey.toBase58(),
  currentStage.id,
  characterId,
  gameResult
);
```

### 2. Character Creation

When a user first connects their wallet:

```typescript
// Create user in Honeycomb
await honeycombBackendService.createUser(
  publicKey.toBase58(),
  username
);

// Create bee character
const character = await honeycombBackendService.createBeeCharacter(
  publicKey.toBase58(),
  `${username}'s Bee`
);
```

### 3. Mission Start

Before starting a game stage:

```typescript
// Start mission in Honeycomb
await honeycombBackendService.startStage(
  publicKey.toBase58(),
  stageId,
  characterId
);
```

## 📊 API Endpoints

### Game Management
- `POST /api/game/stage/start` - Start a game stage
- `POST /api/game/stage/complete` - Complete a game stage
- `GET /api/game/stages` - Get all available stages
- `GET /api/game/progress/:walletAddress` - Get player progress

### Character Management
- `POST /api/game/character/create-bee` - Create bee character
- `GET /api/user/characters/:walletAddress` - Get user's characters

### Resource Management
- `POST /api/honeycomb/resource/mine` - Mine resources
- `GET /api/user/resources/:walletAddress` - Get user's resources

## 🎯 Implementation Steps

### Step 1: Update App.tsx

1. Import the backend service:
```typescript
import { honeycombBackendService } from '@/lib/honeycombBackendService';
```

2. Replace stage completion logic:
```typescript
const handleMissionComplete = useCallback(async (success: boolean) => {
  if (success && currentStage && publicKey) {
    const gameResult = {
      success: true,
      honeyCollected: honeyJarsCollected,
      timeElapsed: missionProgress.timeRemaining || 0,
      score: finalScore
    };

    try {
      await honeycombBackendService.completeStage(
        publicKey.toBase58(),
        currentStage.id,
        characterId, // You'll need to track this
        gameResult
      );
      console.log('Stage completed in Honeycomb!');
    } catch (error) {
      console.error('Failed to complete stage in Honeycomb:', error);
    }
  }
}, [currentStage, publicKey, honeyJarsCollected, missionProgress, finalScore]);
```

### Step 2: Add Character Management

1. Create a character state:
```typescript
const [characterId, setCharacterId] = useState<string | null>(null);
```

2. Create character on first login:
```typescript
useEffect(() => {
  const initializeCharacter = async () => {
    if (connected && publicKey && usernameSaved && !characterId) {
      try {
        const character = await honeycombBackendService.createBeeCharacter(
          publicKey.toBase58(),
          `${username}'s Bee`
        );
        setCharacterId(character.character.address);
      } catch (error) {
        console.error('Failed to create character:', error);
      }
    }
  };
  
  initializeCharacter();
}, [connected, publicKey, usernameSaved, characterId]);
```

### Step 3: Add Mission Start

1. Update stage selection:
```typescript
const handleStageSelect = useCallback(async (stageId: number) => {
  if (!characterId) {
    console.error('No character available');
    return;
  }

  try {
    await honeycombBackendService.startStage(
      publicKey!.toBase58(),
      stageId,
      characterId
    );
    
    // Continue with existing stage selection logic
    const stage = stageManager.getStage(stageId);
    if (!stage || !stage.unlocked) return;
    
    setCurrentStage(stage);
    setGameScreen("playing");
    // ... rest of existing logic
  } catch (error) {
    console.error('Failed to start mission:', error);
  }
}, [characterId, publicKey, stageManager]);
```

## 🔍 Testing the Integration

### 1. Test Backend Health
```bash
curl http://localhost:3001/health
```

### 2. Test Mission Creation
```bash
curl -X POST http://localhost:3001/api/game/init-missions
```

### 3. Test Character Creation
```bash
curl -X POST http://localhost:3001/api/game/character/create-bee \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"your_wallet_address","characterName":"TestBee"}'
```

### 4. Test Stage Completion
```bash
curl -X POST http://localhost:3001/api/game/stage/complete \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress":"your_wallet_address",
    "stageId":1,
    "characterId":"your_character_id",
    "gameResult":{
      "success":true,
      "honeyCollected":4,
      "timeElapsed":45,
      "score":100
    }
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Check if backend is running on port 3001
   - Verify CORS settings in backend `.env`

2. **Honeycomb API Errors**
   - Check `HONEYCOMB_API_URL` in backend `.env`
   - Verify admin keypair is properly set

3. **Character Creation Fails**
   - Ensure user exists before creating character
   - Check wallet connection status

4. **Mission Completion Fails**
   - Verify mission exists in Honeycomb
   - Check character ownership

### Debug Logs

The backend provides detailed logging:
- API requests and responses
- Honeycomb transaction details
- Error messages with context

## 🎉 Next Steps

### Advanced Features to Add

1. **Staking System**: Implement Nectar Staking for long-term engagement
2. **Character Trading**: Allow players to trade bee characters
3. **Guild System**: Create player guilds and cooperative missions
4. **Seasonal Events**: Time-limited missions with special rewards
5. **Achievement System**: Track and reward player accomplishments

### Performance Optimization

1. **Caching**: Cache frequently accessed data
2. **Batch Operations**: Group multiple transactions
3. **Off-chain State**: Use traditional database for non-critical data
4. **Compression**: Implement Honeycomb's compression for cost savings

## 📚 Resources

- [Honeycomb Protocol Documentation](https://docs.honeycombprotocol.com/)
- [Solana Web3.js Documentation](https://docs.solana.com/developing/clients/javascript-api)
- [CrossRoad Game Repository](your-repo-url)

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs for error details
3. Verify all environment variables are set correctly
4. Test with the provided curl commands

Happy coding! 🐝✨
