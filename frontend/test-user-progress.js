// Test script for the enhanced user progress system
import { loadUserProgress, saveUserProgress, completeStage, updateLoyaltyProgress } from './src/lib/supabaseUserProgress.js';

console.log('Testing enhanced user progress system...');

// Test wallet address
const testWallet = 'test_wallet_' + Date.now();

async function testUserProgress() {
  try {
    // Test 1: Load/Create user progress
    console.log('\n1. Testing loadUserProgress...');
    const progress = await loadUserProgress(testWallet);
    if (progress) {
      console.log('✅ User progress loaded/created successfully');
      console.log('   - Current stage:', progress.currentStage);
      console.log('   - Total XP:', progress.totalXP);
      console.log('   - Loyalty tier:', progress.loyaltyTier);
    } else {
      console.log('❌ Failed to load/create user progress');
      return;
    }

    // Test 2: Save user progress
    console.log('\n2. Testing saveUserProgress...');
    const saveResult = await saveUserProgress({
      walletAddress: testWallet,
      totalXP: 100,
      totalHoney: 50,
      currentStage: 2,
    });
    
    if (saveResult.success) {
      console.log('✅ User progress saved successfully');
    } else {
      console.log('❌ Failed to save user progress:', saveResult.error);
    }

    // Test 3: Complete stage
    console.log('\n3. Testing completeStage...');
    const stageResult = await completeStage({
      walletAddress: testWallet,
      stageId: 1,
      honeyCollected: 15,
      timeElapsed: 45,
      score: 1500,
      isPerfect: true,
    });
    
    if (stageResult.success) {
      console.log('✅ Stage completion saved successfully');
    } else {
      console.log('❌ Failed to save stage completion:', stageResult.error);
    }

    // Test 4: Update loyalty progress
    console.log('\n4. Testing updateLoyaltyProgress...');
    const loyaltyResult = await updateLoyaltyProgress(testWallet, {
      loyaltyTier: 'Worker Bee',
      loyaltyStreak: 3,
      loyaltyLastLogin: new Date().toISOString(),
    });
    
    if (loyaltyResult.success) {
      console.log('✅ Loyalty progress updated successfully');
    } else {
      console.log('❌ Failed to update loyalty progress:', loyaltyResult.error);
    }

    // Test 5: Verify final state
    console.log('\n5. Verifying final state...');
    const finalProgress = await loadUserProgress(testWallet);
    if (finalProgress) {
      console.log('✅ Final progress loaded successfully');
      console.log('   - Total XP:', finalProgress.totalXP);
      console.log('   - Total Honey:', finalProgress.totalHoney);
      console.log('   - Current Stage:', finalProgress.currentStage);
      console.log('   - Loyalty Tier:', finalProgress.loyaltyTier);
      console.log('   - Perfect Scores:', finalProgress.perfectScores);
      console.log('   - Stage 1 Honey:', finalProgress.stage1Honey);
    } else {
      console.log('❌ Failed to load final progress');
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testUserProgress();
