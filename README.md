# 🐝 BigBee - Honeycomb-Powered Bee Game

A 3D crossy road-style game that demonstrates the power of Honeycomb Protocol for on-chain progression, mission systems, and player loyalty mechanics.

## 🎮 Live Demo

**Frontend**: [https://bigbeee.netlify.app/](https://bigbeee.netlify.app/)


### CORE CONCEPTS

✅ **Honeycomb Protocol Integration**: Core game mechanics powered by Honeycomb missions and progression  
✅ **Mission System**: 7 unique stages with on-chain completion tracking  
✅ **On-chain Progression**: XP and honey rewards tracked permanently on-chain  
✅ **Trait Evolution**: Player loyalty tiers that evolve based on performance  
✅ **Creative Game Design**: 3D bee-themed crossy road with unique mechanics  
✅ **Verxio Integration**: Advanced loyalty system with streaks and multipliers  
✅ **Three.js**: Immersive 3D game experience  
✅ **Solana Integration**: Wallet-based identity and on-chain state management  
✅ **Multiplayer Support**: Real-time competitive racing mode  

## 🎯 Game Concept

BigBee is a 3D bee-themed crossy road game where players navigate through increasingly challenging environments to collect honey and complete missions. The game leverages Honeycomb Protocol to create a permanent, verifiable progression system that follows players across any dApp or wallet.

### Core Features

- **7 Unique Stages**: Each with different objectives and difficulty levels
- **On-chain Progression**: Permanent XP and honey tracking via Honeycomb
- **Loyalty System**: Verxio-powered tier system with multipliers and rewards
- **Multiplayer Racing**: Real-time competitive mode with Supabase
- **3D Graphics**: Immersive Three.js-powered game environment
- **Wallet Integration**: Solana wallet-based identity and rewards

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Game Engine**: Three.js for 3D graphics and physics
- **State Management**: React hooks with on-chain state persistence
- **Wallet Integration**: Solana wallet adapter
- **UI Framework**: Custom components with Tailwind CSS

### Backend (Node.js + Express)
- **Honeycomb Integration**: Mission creation and completion tracking
- **API Endpoints**: Stage completion, user progress, and rewards
- **CORS Configuration**: Secure cross-origin communication

### Blockchain Integration
- **Honeycomb Protocol**: Mission system and on-chain progression
- **Verxio Protocol**: Loyalty tiers and reward multipliers
- **Solana**: Wallet connection and transaction handling

## 🎮 Game Mechanics

### Mission System (Honeycomb-Powered)
Each stage represents a unique mission with specific objectives:

1. **Honey Rush - Stage 1**: Collect 4 honey jars in 60 seconds
2. **Honey Rush - Stage 2**: Collect 7 honey jars in 90 seconds  
3. **Honey Rush - Stage 3**: Collect 10 honey jars in 120 seconds
4. **Timed Dash**: Reach the finish line in 45 seconds
5. **Wasp Escape**: Survive for 30 seconds while being chased
6. **Rescue Mission**: Guide 3 lost bees to the safe zone
7. **Honey Heist**: Collect honey while avoiding guard wasps

### Progression System
- **XP Rewards**: Earned for completing missions and achieving objectives
- **Honey Collection**: Primary resource that unlocks new stages
- **Loyalty Tiers**: Verxio-powered system with multipliers and bonuses
- **Achievement Tracking**: Permanent on-chain achievement history

### Loyalty Mechanics (Verxio-Powered)
- **Tier System**: Honey Bee → Worker Bee → Queen Bee → Royal Bee
- **Streak Bonuses**: Daily login streaks provide XP multipliers
- **Voucher System**: Special rewards for tier upgrades and achievements
- **Multiplier Effects**: Increased rewards based on loyalty tier

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crossroad
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install backend dependencies
   cd ../backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend (.env file in backend/ directory)
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   HONEYCOMB_API_URL=https://edge.main.honeycombprotocol.com/
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ADMIN_PRIVATE_KEY=your_admin_private_key
   ```

4. **Start the development servers**
   ```bash
   # Start backend (from backend/ directory)
   npm run dev
   
   # Start frontend (from frontend/ directory)
   npm run dev
   ```

5. **Access the game**
   - Frontend: http://localhost:5173
   - Backend Health: http://localhost:3001/health

### Production Deployment

#### Backend (Render)
1. Connect GitHub repository to Render
2. Set root directory to `backend`
3. Configure environment variables
4. Deploy

#### Frontend (Netlify)
1. Connect GitHub repository to Netlify
2. Set build directory to `frontend`
3. Set environment variables:
   ```
   VITE_BACKEND_URL=https://your-render-backend-url.onrender.com
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🔧 Technical Implementation

### Honeycomb Protocol Integration

The game uses Honeycomb Protocol for:
- **Mission Creation**: Each stage is a Honeycomb mission with specific parameters
- **Completion Tracking**: Stage completions are recorded on-chain
- **Progression History**: Permanent record of player achievements
- **Trait Assignment**: Player traits evolve based on performance

```javascript
// Example: Creating a mission in Honeycomb
const mission = await honeycombService.createMission({
  name: "Honey Rush - Stage 1",
  description: "Collect 4 honey jars in 60 seconds",
  duration: 60,
  targetAmount: 4,
  resourceType: "honey",
  rewardXP: 50,
  rewardHoney: 100
});
```

### Verxio Loyalty System

Verxio powers the loyalty mechanics:
- **Tier Progression**: Automatic tier upgrades based on XP
- **Streak Tracking**: Daily login streaks with multipliers
- **Voucher Distribution**: Special rewards for achievements
- **Multiplier Effects**: Increased rewards for higher tiers

```javascript
// Example: Processing loyalty rewards
const rewards = await verxioLoyaltyService.processStageCompletion(
  walletAddress,
  stageId,
  honeyCollected,
  timeElapsed,
  isPerfect
);
```

### Three.js Game Engine

The 3D game environment is built with Three.js:
- **3D Graphics**: Immersive bee-themed world
- **Physics Engine**: Realistic movement and collision detection
- **Animation System**: Smooth character and object animations
- **Performance Optimization**: Efficient rendering for web browsers

### Multiplayer System

Real-time multiplayer using Supabase:
- **Session Management**: Create and join racing sessions
- **Real-time Updates**: Live position and score tracking
- **Leaderboards**: Competitive rankings and achievements
- **Cross-platform**: Works across different devices and browsers


- **Live Demo**: [https://bigbeee.netlify.app/](https://bigbeee.netlify.app/)
- **Honeycomb Docs**: [https://docs.honeycombprotocol.com/](https://docs.honeycombprotocol.com/)
- **Verxio Docs**: [https://docs.verxio.xyz/](https://docs.verxio.xyz/)
- **Three.js**: [https://threejs.org/](https://threejs.org/)

## 🤝 Contributing

This project is open source. Feel free to submit issues and pull requests.

**Built with ❤️ for the Honeycomb Protocol Game Jam**
