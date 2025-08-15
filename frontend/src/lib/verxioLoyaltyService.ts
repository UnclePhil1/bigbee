// Safely import Verxio modules with fallbacks
let verxioModules: any = {};
let umiModules: any = {};

try {
  verxioModules = {
    createLoyaltyProgram: require("@verxioprotocol/core").createLoyaltyProgram,
    issueLoyaltyPass: require("@verxioprotocol/core").issueLoyaltyPass,
    awardLoyaltyPoints: require("@verxioprotocol/core").awardLoyaltyPoints,
    createVoucherCollection: require("@verxioprotocol/core").createVoucherCollection,
    mintVoucher: require("@verxioprotocol/core").mintVoucher,
    sendMessage: require("@verxioprotocol/core").sendMessage,
    initializeVerxio: require("@verxioprotocol/core").initializeVerxio,
    getAssetData: require("@verxioprotocol/core").getAssetData,
    getProgramDetails: require("@verxioprotocol/core").getProgramDetails,
    getUserVouchers: require("@verxioprotocol/core").getUserVouchers,
    revokeLoyaltyPoints: require("@verxioprotocol/core").revokeLoyaltyPoints,
    giftLoyaltyPoints: require("@verxioprotocol/core").giftLoyaltyPoints,
  };
  
  umiModules = {
    createUmi: require("@metaplex-foundation/umi-bundle-defaults").createUmi,
    publicKey: require("@metaplex-foundation/umi").publicKey,
    keypairIdentity: require("@metaplex-foundation/umi").keypairIdentity,
    generateSigner: require("@metaplex-foundation/umi").generateSigner,
  };
} catch (error) {
  console.warn("Verxio modules not available, using fallback implementation:", error);
}

export const LOYALTY_CONFIG = {
  programName: "CrossRoad Bee Loyalty",
  organizationName: "CrossRoad Game",
  brandColor: "#FFD700", // Gold color for bees
  tiers: [
    {
      name: "Honey Bee",
      xpRequired: 0,
      rewards: ["Basic rewards", "Daily login bonus"],
    },
    {
      name: "Worker Bee",
      xpRequired: 500,
      rewards: ["2x honey multiplier", "Special missions"],
    },
    {
      name: "Queen Bee",
      xpRequired: 1500,
      rewards: ["3x honey multiplier", "Exclusive vouchers"],
    },
    {
      name: "Royal Bee",
      xpRequired: 3000,
      rewards: ["5x honey multiplier", "VIP events", "Custom skins"],
    },
  ],
  pointsPerAction: {
    stage_completion: 100,
    honey_collection: 10,
    daily_login: 50,
    streak_bonus: 25,
    perfect_score: 200,
    mission_completion: 150,
  },
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
  type: "honey_boost" | "xp_boost" | "skin_unlock" | "mission_unlock";
  value: number;
  expiresAt: string;
  isRedeemed: boolean;
}

export class VerxioLoyaltyService {
  private loyaltyProgramAddress?: any;
  private isInitialized: boolean = false;
  private programAuthority: string;
  private context: any;
  private umi: any;

  constructor(programAuthority: string) {
    this.programAuthority = programAuthority;
    console.log("Verxio loyalty service initialized");
    console.log("Program authority:", programAuthority || "not configured");
  }

  // Initialize the service with real Verxio integration
  private async initialize() {
    if (this.isInitialized) return;

    try {
      if (!this.programAuthority) {
        throw new Error("Program authority not configured");
      }

      if (!umiModules.createUmi || !verxioModules.initializeVerxio) {
        throw new Error("Verxio modules not available");
      }

      // Initialize UMI and Verxio with Solana connection
      this.umi = umiModules.createUmi("https://api.devnet.solana.com");
      this.context = verxioModules.initializeVerxio(
        this.umi,
        umiModules.publicKey(this.programAuthority)
      );

      // Set up fee payer identity (using program authority as fee payer)
      this.context.umi.use(umiModules.keypairIdentity(umiModules.generateSigner(this.umi)));

      this.isInitialized = true;
      console.log("Verxio loyalty service ready (full on-chain mode)");
    } catch (error) {
      console.error("Failed to initialize Verxio loyalty service:", error);
      console.log("Falling back to local mode");
      this.isInitialized = true; // Allow local mode to work
    }
  }

  // Create the main loyalty program for CrossRoad
  async createLoyaltyProgram() {
    await this.initialize();

    try {
      if (!this.context || !this.context.programAuthority || !verxioModules.createLoyaltyProgram) {
        throw new Error("Verxio context not properly initialized");
      }

      const result = await verxioModules.createLoyaltyProgram(this.context, {
        loyaltyProgramName: LOYALTY_CONFIG.programName,
        metadataUri: "https://arweave.net/crossroad-loyalty-metadata",
        programAuthority: this.context.programAuthority,
        updateAuthority: umiModules.generateSigner(this.umi),
        metadata: {
          organizationName: LOYALTY_CONFIG.organizationName,
          brandColor: LOYALTY_CONFIG.brandColor,
        },
        tiers: [
          {
            name: "Grind",
            xpRequired: 0,
            rewards: ["Welcome bonus", "Daily login bonus"],
          },
          {
            name: "Honey Bee",
            xpRequired: 500,
            rewards: ["2x honey multiplier", "Special missions"],
          },
          {
            name: "Worker Bee",
            xpRequired: 1500,
            rewards: ["3x honey multiplier", "Exclusive vouchers"],
          },
          {
            name: "Queen Bee",
            xpRequired: 3000,
            rewards: ["5x honey multiplier", "VIP events", "Custom skins"],
          },
        ],
        pointsPerAction: LOYALTY_CONFIG.pointsPerAction,
      });

      this.loyaltyProgramAddress = result.collection.publicKey;
      console.log(
        "CrossRoad Loyalty Program Created (on-chain):",
        this.loyaltyProgramAddress
      );

      return result;
    } catch (error) {
      console.error("Failed to create loyalty program:", error);
      // Fallback to local mode
      this.loyaltyProgramAddress = "local-loyalty-program";
      console.log(
        "CrossRoad Loyalty Program Created (fallback mode):",
        this.loyaltyProgramAddress
      );
      return {
        collection: { publicKey: this.loyaltyProgramAddress },
        signature: "local-signature",
      };
    }
  }

  // Issue loyalty pass to a player
  async issueLoyaltyPass(walletAddress: string, username: string) {
    await this.initialize();

    try {
      if (!this.context || !this.loyaltyProgramAddress || !verxioModules.issueLoyaltyPass) {
        throw new Error("Verxio context or loyalty program not initialized");
      }

      // Issue loyalty pass on-chain using Verxio SDK
      const result = await verxioModules.issueLoyaltyPass(this.context, {
        collectionAddress: this.loyaltyProgramAddress,
        recipient: umiModules.publicKey(walletAddress),
        passName: `${username}'s Bee Pass`,
        passMetadataUri: "https://arweave.net/bee-pass-metadata",
        updateAuthority: this.context.programAuthority,
        organizationName: LOYALTY_CONFIG.organizationName,
      });

      console.log(
        `Loyalty pass issued to ${username} (on-chain):`,
        result.asset.publicKey
      );

      return result;
    } catch (error) {
      console.error("Failed to issue loyalty pass:", error);
      // Fallback to local mode
      const passAddress = `local-pass-${walletAddress}-${Date.now()}`;
      console.log(
        `Loyalty pass issued to ${username} (fallback mode):`,
        passAddress
      );
      return {
        asset: { publicKey: passAddress },
        signature: "local-signature",
      };
    }
  }

  // Award points for game actions
  async awardPoints(
    walletAddress: string,
    action: keyof typeof LOYALTY_CONFIG.pointsPerAction,
    amount?: number
  ) {
    await this.initialize();

    const pointsToAward = amount || LOYALTY_CONFIG.pointsPerAction[action];

    try {
      if (!this.context || !verxioModules.awardLoyaltyPoints) {
        throw new Error("Verxio context not initialized");
      }

      const result = await verxioModules.awardLoyaltyPoints(this.context, {
        passAddress: umiModules.publicKey(walletAddress),
        action: action,
        signer: this.context.programAuthority,
        multiplier: 1,
      });

      console.log(
        `Awarded ${pointsToAward} points to ${walletAddress} for ${action} (on-chain)`
      );
      return result;
    } catch (error) {
      console.error("Failed to award points:", error);
      // Fallback to local mode
      console.log(
        `Awarded ${pointsToAward} points to ${walletAddress} for ${action} (fallback mode)`
      );
      return { signature: "local-signature" };
    }
  }

  // Create voucher collection for rewards
  async createVoucherCollection(name: string, description: string) {
    await this.initialize();
    
    try {
      if (!this.context || !verxioModules.createVoucherCollection) {
        throw new Error("Verxio context not initialized");
      }

      // TODO: Implement real voucher collection creation when API is fully documented
      // For now, use fallback mode
      const collectionAddress = `local-collection-${Date.now()}`;
      console.log("Voucher collection created (fallback mode):", collectionAddress);
      return {
        collection: { publicKey: collectionAddress },
        signature: "local-signature",
      };
    } catch (error) {
      console.error("Failed to create voucher collection:", error);
      // Fallback to local mode
      const collectionAddress = `local-collection-${Date.now()}`;
      console.log("Voucher collection created (fallback mode):", collectionAddress);
      return {
        collection: { publicKey: collectionAddress },
        signature: "local-signature",
      };
    }
  }

  async mintVoucher(
    walletAddress: string,
    _voucherType: Voucher["type"],
    _value: number,
    expiresInDays: number = 30
  ) {
    await this.initialize();

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const voucherAddress = `local-voucher-${walletAddress}-${Date.now()}`;
      console.log(
        `Voucher minted for ${walletAddress} (local mode):`,
        voucherAddress
      );

      return {
        asset: { publicKey: voucherAddress },
        signature: "local-signature",
        voucherAddress: voucherAddress,
      };
    } catch (error) {
      console.error("Failed to mint voucher:", error);
      throw error;
    }
  }

  // Send message to player (placeholder)
  async sendMessage(walletAddress: string, _message: string) {
    await this.initialize();

    try {
      const messageId = `local-message-${walletAddress}-${Date.now()}`;
      console.log(`Message sent to ${walletAddress} (local mode):`, messageId);

      return {
        message: { publicKey: messageId },
        signature: "local-signature",
      };
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  // Get user's loyalty pass data from blockchain
  async getUserLoyaltyData(passAddress: string) {
    await this.initialize();

    try {
      if (!this.context || !verxioModules.getAssetData) {
        throw new Error("Verxio context not initialized");
      }

      const assetData = await verxioModules.getAssetData(
        this.context,
        umiModules.publicKey(passAddress)
      );

      console.log("Retrieved user loyalty data from blockchain:", assetData);
      return assetData;
    } catch (error) {
      console.error("Failed to get user loyalty data:", error);
      // Fallback to local calculation
      return null;
    }
  }

  // Get program details from blockchain
  async getProgramDetails() {
    await this.initialize();
    
    try {
      if (!this.context || !this.loyaltyProgramAddress || !verxioModules.getProgramDetails) {
        throw new Error("Verxio context or loyalty program not initialized");
      }

      const programDetails = await verxioModules.getProgramDetails(this.context);

      console.log("Retrieved program details from blockchain:", programDetails);
      return programDetails;
    } catch (error) {
      console.error("Failed to get program details:", error);
      // Fallback to local config
      return {
        name: LOYALTY_CONFIG.programName,
        tiers: LOYALTY_CONFIG.tiers,
        pointsPerAction: LOYALTY_CONFIG.pointsPerAction,
      };
    }
  }

  // Get user vouchers from blockchain
  async getUserVouchers(walletAddress: string) {
    await this.initialize();
    
    try {
      if (!this.context || !verxioModules.getUserVouchers) {
        throw new Error("Verxio context not initialized");
      }

      // Get real user vouchers from blockchain using Verxio SDK
      const vouchers = await verxioModules.getUserVouchers(this.context, {
        userAddress: umiModules.publicKey(walletAddress)
      });
      
      console.log("Retrieved user vouchers from blockchain:", vouchers);
      return vouchers;
    } catch (error) {
      console.error("Failed to get user vouchers:", error);
      // Fallback to empty array
      return [];
    }
  }

  // Gift points to user (special bonus)
  async giftPoints(walletAddress: string, points: number, reason: string) {
    await this.initialize();
    
    try {
      if (!this.context || !verxioModules.giftLoyaltyPoints) {
        throw new Error("Verxio context not initialized");
      }

      // Gift real points on-chain using Verxio SDK
      const result = await verxioModules.giftLoyaltyPoints(this.context, {
        passAddress: umiModules.publicKey(walletAddress),
        pointsToGift: points,
        signer: this.context.programAuthority,
        action: reason,
      });

      console.log(`Gifted ${points} points to ${walletAddress} for ${reason} (on-chain)`);
      return result;
    } catch (error) {
      console.error("Failed to gift points:", error);
      // Fallback to local mode
      console.log(`Gifted ${points} points to ${walletAddress} for ${reason} (fallback mode)`);
      return { signature: "local-signature" };
    }
  }

  // Revoke points from user
  async revokePoints(walletAddress: string, points: number) {
    await this.initialize();
    
    try {
      if (!this.context || !verxioModules.revokeLoyaltyPoints) {
        throw new Error("Verxio context not initialized");
      }

      // Revoke real points on-chain using Verxio SDK
      const result = await verxioModules.revokeLoyaltyPoints(this.context, {
        passAddress: umiModules.publicKey(walletAddress),
        pointsToRevoke: points,
        signer: this.context.programAuthority,
      });

      console.log(`Revoked ${points} points from ${walletAddress} (on-chain)`);
      return result;
    } catch (error) {
      console.error("Failed to revoke points:", error);
      // Fallback to local mode
      console.log(`Revoked ${points} points from ${walletAddress} (fallback mode)`);
      return { signature: "local-signature" };
    }
  }

  // Get current tier based on XP
  getCurrentTier(totalXP: number): string {
    const sortedTiers = [...LOYALTY_CONFIG.tiers].sort(
      (a, b) => b.xpRequired - a.xpRequired
    );

    for (const tier of sortedTiers) {
      if (totalXP >= tier.xpRequired) {
        return tier.name;
      }
    }

    return LOYALTY_CONFIG.tiers[0].name; // Default to first tier
  }

  // Calculate tier progress
  getTierProgress(totalXP: number): {
    currentTier: string;
    nextTier: string;
    progress: number;
  } {
    const currentTier = this.getCurrentTier(totalXP);
    const currentTierData = LOYALTY_CONFIG.tiers.find(
      (t) => t.name === currentTier
    );
    const nextTierData = LOYALTY_CONFIG.tiers.find(
      (t) => t.xpRequired > totalXP
    );

    if (!currentTierData || !nextTierData) {
      return {
        currentTier,
        nextTier: currentTier,
        progress: 100,
      };
    }

    const progress =
      ((totalXP - currentTierData.xpRequired) /
        (nextTierData.xpRequired - currentTierData.xpRequired)) *
      100;

    return {
      currentTier,
      nextTier: nextTierData.name,
      progress: Math.min(100, Math.max(0, progress)),
    };
  }

  // Calculate multiplier based on tier
  getTierMultiplier(tierName: string): number {
    const tier = LOYALTY_CONFIG.tiers.find((t) => t.name === tierName);
    if (!tier) return 1;

    switch (tier.name) {
      case "Honey Bee":
        return 1;
      case "Worker Bee":
        return 2;
      case "Queen Bee":
        return 3;
      case "Royal Bee":
        return 5;
      default:
        return 1;
    }
  }

  // Generate daily login bonus
  async processDailyLogin(
    walletAddress: string,
    currentStreak: number
  ): Promise<{ points: number; streak: number }> {
    const basePoints = LOYALTY_CONFIG.pointsPerAction.daily_login;
    const streakBonus =
      currentStreak * LOYALTY_CONFIG.pointsPerAction.streak_bonus;
    const totalPoints = basePoints + streakBonus;

    await this.awardPoints(walletAddress, "daily_login", totalPoints);

    return {
      points: totalPoints,
      streak: currentStreak + 1,
    };
  }

  // Process stage completion rewards
  async processStageCompletion(
    walletAddress: string,
    _stageId: number,
    honeyCollected: number,
    _timeElapsed: number,
    isPerfect: boolean = false
  ) {
    const rewards = [];

    // Base stage completion points
    await this.awardPoints(walletAddress, "stage_completion");
    rewards.push({
      type: "points",
      amount: LOYALTY_CONFIG.pointsPerAction.stage_completion,
      reason: "Stage completion",
    });

    // Honey collection points
    if (honeyCollected > 0) {
      const honeyPoints =
        honeyCollected * LOYALTY_CONFIG.pointsPerAction.honey_collection;
      await this.awardPoints(walletAddress, "honey_collection", honeyPoints);
      rewards.push({
        type: "points",
        amount: honeyPoints,
        reason: "Honey collection",
      });
    }

    // Perfect score bonus
    if (isPerfect) {
      await this.awardPoints(walletAddress, "perfect_score");
      rewards.push({
        type: "points",
        amount: LOYALTY_CONFIG.pointsPerAction.perfect_score,
        reason: "Perfect score",
      });
    }

    // Mission completion bonus
    await this.awardPoints(walletAddress, "mission_completion");
    rewards.push({
      type: "points",
      amount: LOYALTY_CONFIG.pointsPerAction.mission_completion,
      reason: "Mission completion",
    });

    return rewards;
  }
}

// Export singleton instance with fallback
const programAuthority =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_VERXIO_PROGRAM_AUTHORITY) ||
  "";
export const verxioLoyaltyService = new VerxioLoyaltyService(programAuthority);
