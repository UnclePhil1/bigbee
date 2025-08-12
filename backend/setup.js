#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 CrossRoad Backend Setup');
console.log('==========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env file...');
  
  // Generate a new admin keypair
  const adminKeypair = Keypair.generate();
  const adminPrivateKey = bs58.encode(adminKeypair.secretKey);
  
  const envContent = `# Backend Configuration
PORT=3001
NODE_ENV=development

FRONTEND_URL=http://localhost:5173

HONEYCOMB_API_URL=https://edge.main.honeycombprotocol.com/

SOLANA_RPC_URL=https://rpc.main.honeycombprotocol.com

ADMIN_PRIVATE_KEY=${adminPrivateKey}
`;

  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file created successfully!');
  console.log(`🔑 Admin public key: ${adminKeypair.publicKey.toBase58()}`);
  console.log(`🔐 Admin private key: ${adminPrivateKey}`);
  console.log('\n⚠️  IMPORTANT: Keep your admin private key secure!');
  console.log('   This keypair will be used for all backend operations.');
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
const nodeModulesExists = fs.existsSync(nodeModulesPath);

if (!nodeModulesExists) {
  console.log('\n📦 Installing dependencies...');
  console.log('   Run: npm install');
} else {
  console.log('\n✅ Dependencies already installed');
}

console.log('\n🎯 Next Steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Start the backend: npm run dev');
console.log('3. Initialize Honeycomb project: POST /api/honeycomb/project/init');
console.log('4. Initialize game missions: POST /api/game/init-missions');
console.log('\n🌐 Backend will be available at: http://localhost:3001');
console.log('📊 Health check: http://localhost:3001/health');

console.log('\n📚 API Documentation:');
console.log('- Honeycomb API: http://localhost:3001/api/honeycomb');
console.log('- Game API: http://localhost:3001/api/game');
console.log('- User API: http://localhost:3001/api/user');

console.log('\n🎮 Happy coding! 🐝');
