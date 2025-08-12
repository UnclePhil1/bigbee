# CrossRoad Backend - Honeycomb Protocol Integration

This backend provides a complete integration with Honeycomb Protocol for the CrossRoad game, handling missions, traits, and progression logic.

## Features

- **Honeycomb Protocol Integration**: Full integration with Honeycomb's Edge Client
- **Mission Management**: Create, start, and complete missions
- **Character System**: Create and manage bee characters with traits
- **Resource Management**: Mine and track honey, XP, and other resources
- **User Management**: Handle user profiles and progress
- **Game State Management**: Track stage completion and rewards

## Quick Start

### 1. Setup Environment

```bash
# Run the setup script to create .env file and generate admin keypair
node setup.js
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Backend

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:3001`

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Backend Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Honeycomb Protocol Configuration
HONEYCOMB_API_URL=https://edge.main.honeycombprotocol.com/

# Solana Configuration
SOLANA_RPC_URL=https://rpc.main.honeycombprotocol.com

# Admin Configuration (Required)
ADMIN_PRIVATE_KEY=your_admin_private_key_here
```

## API Endpoints

### Health Check
- `GET /health` - Check backend status

### Honeycomb Integration
- `POST /api/honeycomb/project/init` - Initialize Honeycomb project
- `POST /api/honeycomb/user` - Create user
- `GET /api/honeycomb/user/:walletAddress` - Get user data
- `POST /api/honeycomb/character` - Create character
- `GET /api/honeycomb/character/:characterId` - Get character data
- `POST /api/honeycomb/mission` - Create mission
- `GET /api/honeycomb/mission/:missionId` - Get mission data
- `GET /api/honeycomb/missions` - Get all missions
- `POST /api/honeycomb/mission/start` - Start mission
- `POST /api/honeycomb/mission/complete` - Complete mission
- `POST /api/honeycomb/resource/mine` - Mine resource

### Game Management
- `POST /api/game/init-missions` - Initialize all game missions
- `GET /api/game/stages` - Get all available stages
- `POST /api/game/stage/start` - Start a game stage
- `POST /api/game/stage/complete` - Complete a game stage
- `GET /api/game/progress/:walletAddress` - Get player progress
- `POST /api/game/character/create-bee` - Create bee character

### User Management
- `GET /api/user/profile/:walletAddress` - Get user profile
- `PUT /api/user/profile/:walletAddress` - Update user profile
- `GET /api/user/characters/:walletAddress` - Get user's characters
- `GET /api/user/resources/:walletAddress` - Get user's resources
- `GET /api/user/missions/:walletAddress` - Get user's mission history
- `GET /api/user/achievements/:walletAddress` - Get user's achievements

## Game Stages

The backend includes 7 predefined game stages:

1. **Stage 1**: Honey Rush - Collect 4 honey jars in 60 seconds
2. **Stage 2**: Honey Rush - Collect 7 honey jars in 90 seconds
3. **Stage 3**: Honey Rush - Collect 10 honey jars in 120 seconds
4. **Stage 4**: Timed Dash - Reach finish line in 45 seconds
5. **Stage 5**: Wasp Escape - Survive for 30 seconds
6. **Stage 6**: Rescue Mission - Guide 3 lost bees
7. **Stage 7**: Honey Heist - Stealth honey collection

## Character Traits

Bee characters have the following traits:
- **Speed**: Movement speed (1-10)
- **Agility**: Maneuverability (1-10)
- **Honey Capacity**: Maximum honey storage (1-10)
- **Stamina**: Endurance (1-10)
- **Luck**: Random chance bonuses (1-10)
- **Species**: Always "honey_bee"
- **Rarity**: common, uncommon, or rare

## Resource Types

- **Honey**: Primary game currency
- **XP**: Experience points for progression
- **Pollen**: Secondary resource

## Initialization Process

1. **Start the backend**: `npm run dev`
2. **Initialize project**: `POST /api/honeycomb/project/init`
3. **Initialize missions**: `POST /api/game/init-missions`
4. **Create user**: `POST /api/honeycomb/user`
5. **Create character**: `POST /api/game/character/create-bee`

## Frontend Integration

The frontend can communicate with this backend using the `honeycombBackendService`:

```typescript
import { honeycombBackendService } from '@/lib/honeycombBackendService';

// Start a stage
await honeycombBackendService.startStage(walletAddress, stageId, characterId);

// Complete a stage
await honeycombBackendService.completeStage(walletAddress, stageId, characterId, gameResult);
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

## Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── index.js         # Main server file
├── package.json
├── setup.js            # Setup script
└── README.md
```

### Adding New Features

1. **New Routes**: Add to appropriate route file in `src/routes/`
2. **New Services**: Add to `src/services/honeycombService.js`
3. **New Models**: Add to `src/models/` directory

## Troubleshooting

### Common Issues

1. **Admin Keypair Error**: Ensure `ADMIN_PRIVATE_KEY` is set in `.env`
2. **CORS Errors**: Check `FRONTEND_URL` in `.env`
3. **Honeycomb Connection**: Verify `HONEYCOMB_API_URL` is correct
4. **Solana Connection**: Check `SOLANA_RPC_URL` is accessible

### Logs

The backend provides detailed logging for debugging:
- API requests and responses
- Honeycomb transactions
- Error details
- Mission completion events

## Security

- **Admin Keypair**: Keep the admin private key secure
- **CORS**: Configured to only allow frontend origin
- **Input Validation**: All endpoints validate required parameters
- **Error Handling**: Sensitive information is not exposed in error messages

## License

MIT License - see main project license
