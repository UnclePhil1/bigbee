// Simple test for loyalty service
import { verxioLoyaltyService, LOYALTY_CONFIG } from './src/lib/verxioLoyaltyService.js';

console.log('Testing loyalty service...');

// Test configuration
console.log('Loyalty config:', LOYALTY_CONFIG);

// Test tier calculation
const testXP = 750;
const tier = verxioLoyaltyService.getCurrentTier(testXP);
console.log(`XP ${testXP} = Tier: ${tier}`);

// Test tier progress
const progress = verxioLoyaltyService.getTierProgress(testXP);
console.log('Tier progress:', progress);

// Test multiplier
const multiplier = verxioLoyaltyService.getTierMultiplier(tier);
console.log(`Multiplier for ${tier}: ${multiplier}x`);

console.log('Loyalty service test completed successfully!');
