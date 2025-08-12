// CrossRoad Game Loyalty System - Verxio Protocol Foundation
// This provides a local loyalty system that can be upgraded to full Verxio integration
// when proper API setup and metadata uploads are configured

// CrossRoad Game Loyalty System Configuration
export const LOYALTY_CONFIG = {
  programName: "CrossRoad Bee Loyalty",
  organizationName: "CrossRoad Game",
  brandColor: "#FFD700", // Gold color for bees
  tiers: [
    { name: "Honey Bee", xpRequired: 0, rewards: ["Basic rewards", "Daily login bonus"] },
    { name: "Worker Bee", xpRequired: 500, rewards: ["2x honey multiplier", "Special missions"] },
    { name: "Queen Bee", xpRequired: 1500, rewards: ["3x honey multiplier", "Exclusive vouchers"] },
    { name: "Royal Bee", xpRequired: 3000, rewards: ["5x honey multiplier", "VIP events", "Custom skins"] },
  ],
  pointsPerAction: {
    stage_completion: 100,
    honey_collection: 10,
    daily_login: 50,
    streak_bonus: 25,
    perfect_score: 200,
    mission_completion: 150,
  }
};

export interface LoyaltyUser {
  walletAddress: string;
  currentTier: string;
  totalXP: number;
  currentStreak: number;
  lastLoginDate: string;
  loyaltyPassAddress?: string;
  vouchers: Voucher[];
}

export interface Voucher {
  id: string;
  type: 'honey_boost' | 'xp_boost' | 'skin_unlock' | 'mission_unlock';
  value: number;
  expiresAt: string;
  isRedeemed: boolean;
}

export class VerxioLoyaltyService {

  private loyaltyProgramAddress?: string;
  private isInitialized: boolean = false;

  constructor(_programAuthority: string) {
    console.log('Verxio loyalty service initialized (local mode)');
    console.log('Program authority:', _programAuthority || 'not configured');
    console.log('For full Verxio integration, configure proper API setup and metadata uploads');
  }

  // Initialize the service (placeholder for full Verxio integration)
  private async initialize() {
    if (this.isInitialized) return;
    
    try {
      // TODO: Full Verxio integration would initialize here
      // const umi = createUmi('https://api.devnet.solana.com');
      // this.context = initializeVerxio(umi, publicKey(this.programAuthority));
      
      this.isInitialized = true;
      console.log('Loyalty service ready (local mode)');
    } catch (error) {
      console.error('Failed to initialize Verxio loyalty service:', error);
      // Continue in local mode
    }
  }

  // Create the main loyalty program for CrossRoad (placeholder)
  async createLoyaltyProgram() {
    await this.initialize();
    
    try {
      // TODO: Full Verxio integration would create on-chain program here
      // const result = await createLoyaltyProgram(this.context, {
      //   loyaltyProgramName: LOYALTY_CONFIG.programName,
      //   metadataUri: "https://arweave.net/crossroad-loyalty-metadata",
      //   programAuthority: this.context.programAuthority,
      //   updateAuthority: generateSigner(this.context.umi),
      //   metadata: {
      //     organizationName: LOYALTY_CONFIG.organizationName,
      //     brandColor: LOYALTY_CONFIG.brandColor,
      //   },
      //   tiers: LOYALTY_CONFIG.tiers,
      //   pointsPerAction: LOYALTY_CONFIG.pointsPerAction,
      // });
      
      this.loyaltyProgramAddress = "local-loyalty-program";
      console.log('CrossRoad Loyalty Program Created (local mode):', this.loyaltyProgramAddress);
      
      return { collection: { publicKey: this.loyaltyProgramAddress }, signature: "local-signature" };
    } catch (error) {
      console.error('Failed to create loyalty program:', error);
      throw error;
    }
  }

  // Issue loyalty pass to a player (placeholder)
  async issueLoyaltyPass(walletAddress: string, username: string) {
    await this.initialize();
    
    try {
      // TODO: Full Verxio integration would issue on-chain pass here
      // const result = await issueLoyaltyPass(this.context, {
      //   collectionAddress: publicKey(this.loyaltyProgramAddress!),
      //   recipient: publicKey(walletAddress),
      //   passName: `${username}'s Bee Pass`,
      //   passMetadataUri: "https://arweave.net/bee-pass-metadata",
      //   updateAuthority: this.context.programAuthority,
      //   organizationName: LOYALTY_CONFIG.organizationName,
      // });

      const passAddress = `local-pass-${walletAddress}-${Date.now()}`;
      console.log(`Loyalty pass issued to ${username} (local mode):`, passAddress);
      
      return { 
        asset: { publicKey: passAddress }, 
        signature: "local-signature" 
      };
    } catch (error) {
      console.error('Failed to issue loyalty pass:', error);
      throw error;
    }
  }

  // Award points for game actions (local implementation)
  async awardPoints(walletAddress: string, action: keyof typeof LOYALTY_CONFIG.pointsPerAction, amount?: number) {
    await this.initialize();
    
    try {
      const pointsToAward = amount || LOYALTY_CONFIG.pointsPerAction[action];
      
      // TODO: Full Verxio integration would award on-chain points here
      // const result = await awardLoyaltyPoints(this.context, {
      //   collectionAddress: publicKey(this.loyaltyProgramAddress!),
      //   recipient: publicKey(walletAddress),
      //   points: pointsToAward,
      //   reason: `CrossRoad Game: ${action}`,
      // });

      console.log(`Awarded ${pointsToAward} points to ${walletAddress} for ${action} (local mode)`);
      return { signature: "local-signature" };
    } catch (error) {
      console.error('Failed to award points:', error);
      throw error;
    }
  }

  // Create voucher collection for rewards (placeholder)
  async createVoucherCollection(_name: string, _description: string) {
    await this.initialize();
    
    try {
      // TODO: Full Verxio integration would create on-chain collection here
      const collectionAddress = `local-collection-${Date.now()}`;
      console.log('Voucher collection created (local mode):', collectionAddress);
      
      return { collection: { publicKey: collectionAddress }, signature: "local-signature" };
    } catch (error) {
      console.error('Failed to create voucher collection:', error);
      throw error;
    }
  }

  // Mint voucher as reward (local implementation)
  async mintVoucher(walletAddress: string, _voucherType: Voucher['type'], _value: number, expiresInDays: number = 30) {
    await this.initialize();
    
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // TODO: Full Verxio integration would mint on-chain voucher here
      const voucherAddress = `local-voucher-${walletAddress}-${Date.now()}`;
      console.log(`Voucher minted for ${walletAddress} (local mode):`, voucherAddress);
      
      return { 
        asset: { publicKey: voucherAddress }, 
        signature: "local-signature",
        voucherAddress: voucherAddress
      };
    } catch (error) {
      console.error('Failed to mint voucher:', error);
      throw error;
    }
  }

  // Send message to player (placeholder)
  async sendMessage(walletAddress: string, _message: string) {
    await this.initialize();
    
    try {
      // TODO: Full Verxio integration would send on-chain message here
      const messageId = `local-message-${walletAddress}-${Date.now()}`;
      console.log(`Message sent to ${walletAddress} (local mode):`, messageId);
      
      return { 
        message: { publicKey: messageId }, 
        signature: "local-signature" 
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Get user's current tier based on XP
  getCurrentTier(totalXP: number): string {
    const sortedTiers = [...LOYALTY_CONFIG.tiers].sort((a, b) => b.xpRequired - a.xpRequired);
    
    for (const tier of sortedTiers) {
      if (totalXP >= tier.xpRequired) {
        return tier.name;
      }
    }
    
    return LOYALTY_CONFIG.tiers[0].name; // Default to first tier
  }

  // Calculate tier progress
  getTierProgress(totalXP: number): { currentTier: string; nextTier: string; progress: number } {
    const currentTier = this.getCurrentTier(totalXP);
    const currentTierData = LOYALTY_CONFIG.tiers.find(t => t.name === currentTier);
    const nextTierData = LOYALTY_CONFIG.tiers.find(t => t.xpRequired > totalXP);
    
    if (!currentTierData || !nextTierData) {
      return {
        currentTier,
        nextTier: currentTier,
        progress: 100
      };
    }

    const progress = ((totalXP - currentTierData.xpRequired) / (nextTierData.xpRequired - currentTierData.xpRequired)) * 100;
    
    return {
      currentTier,
      nextTier: nextTierData.name,
      progress: Math.min(100, Math.max(0, progress))
    };
  }

  // Calculate multiplier based on tier
  getTierMultiplier(tierName: string): number {
    const tier = LOYALTY_CONFIG.tiers.find(t => t.name === tierName);
    if (!tier) return 1;

    switch (tier.name) {
      case "Honey Bee": return 1;
      case "Worker Bee": return 2;
      case "Queen Bee": return 3;
      case "Royal Bee": return 5;
      default: return 1;
    }
  }

  // Generate daily login bonus
  async processDailyLogin(walletAddress: string, currentStreak: number): Promise<{ points: number; streak: number }> {
    const basePoints = LOYALTY_CONFIG.pointsPerAction.daily_login;
    const streakBonus = currentStreak * LOYALTY_CONFIG.pointsPerAction.streak_bonus;
    const totalPoints = basePoints + streakBonus;
    
    await this.awardPoints(walletAddress, 'daily_login', totalPoints);
    
    return {
      points: totalPoints,
      streak: currentStreak + 1
    };
  }

  // Process stage completion rewards
  async processStageCompletion(walletAddress: string, _stageId: number, honeyCollected: number, _timeElapsed: number, isPerfect: boolean = false) {
    const rewards = [];

    // Base stage completion points
    await this.awardPoints(walletAddress, 'stage_completion');
    rewards.push({ type: 'points', amount: LOYALTY_CONFIG.pointsPerAction.stage_completion, reason: 'Stage completion' });

    // Honey collection points
    if (honeyCollected > 0) {
      const honeyPoints = honeyCollected * LOYALTY_CONFIG.pointsPerAction.honey_collection;
      await this.awardPoints(walletAddress, 'honey_collection', honeyPoints);
      rewards.push({ type: 'points', amount: honeyPoints, reason: 'Honey collection' });
    }

    // Perfect score bonus
    if (isPerfect) {
      await this.awardPoints(walletAddress, 'perfect_score');
      rewards.push({ type: 'points', amount: LOYALTY_CONFIG.pointsPerAction.perfect_score, reason: 'Perfect score' });
    }

    // Mission completion bonus
    await this.awardPoints(walletAddress, 'mission_completion');
    rewards.push({ type: 'points', amount: LOYALTY_CONFIG.pointsPerAction.mission_completion, reason: 'Mission completion' });

    return rewards;
  }
}

// Export singleton instance with fallback
const programAuthority = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VERXIO_PROGRAM_AUTHORITY) || '';
export const verxioLoyaltyService = new VerxioLoyaltyService(programAuthority);
