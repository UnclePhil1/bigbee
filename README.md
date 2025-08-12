# Bee Crossy Road Game

A 3D multiplayer racing game built with React, Three.js, and Solana blockchain integration.

## Project Structure

```
crossroad/
├── frontend/          # React + Vite frontend application
├── backend/           # Node.js backend server
├── package.json       # Root package.json for managing both projects
└── README.md         # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both frontend and backend in development mode:**
   ```bash
   npm run dev
   ```

3. **Or start them separately:**
   ```bash
   # Frontend only
   npm run dev:frontend
   
   # Backend only  
   npm run dev:backend
   ```

## Deployment Options

### Option 1: Deploy as Single Project (Recommended)
Most hosting platforms can handle this structure directly:

- **Vercel**: Deploy the entire project, it will automatically detect and build the frontend
- **Netlify**: Deploy the entire project, configure build command as `npm run build:frontend`
- **Railway/Render**: Deploy the entire project

### Option 2: Deploy Frontend and Backend Separately

#### Frontend Deployment
```bash
cd frontend
npm run build
```
Deploy the `frontend/dist` folder to:
- Vercel
- Netlify  
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

#### Backend Deployment
```bash
cd backend
npm run build
npm start
```
Deploy the backend to:
- Railway
- Render
- Heroku
- AWS EC2
- DigitalOcean App Platform

## Environment Variables

### Frontend (.env in frontend/)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Backend (.env in backend/)
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Features

- 🐝 3D Bee racing game with Three.js
- 🏁 Multiplayer racing with real-time synchronization
- 💰 Solana wallet integration
- 🍯 Honeycomb backend integration
- 🏆 Verxio loyalty system
- 📊 User progress tracking
- 🎮 Multiple game stages and missions

## Development

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Commands
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Three.js
- Tailwind CSS
- Solana Web3.js
- Supabase Client

### Backend
- Node.js
- Express
- Supabase
- Solana Web3.js

## License

MIT
