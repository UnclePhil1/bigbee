import { createEdgeClient } from "@honeycomb-protocol/edge-client";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers.js";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// Initialize Honeycomb client
const API_URL = process.env.HONEYCOMB_API_URL || "https://edge.main.honeycombprotocol.com";
const client = createEdgeClient(API_URL, true);

// Initialize Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
);

// Game configuration
const GAME_CONFIG = {
  projectName: "CrossRoad - Bee Game",
  projectDescription: "A 3D crossy road-style bee game with Web3 integration",
  projectImageUri: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
};

class HoneycombService {
  constructor() {
    this.projectId = null;
    this.adminKeypair = null;
  }

  // Initialize admin keypair from environment variable
  initializeAdmin() {
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error("ADMIN_PRIVATE_KEY environment variable is required");
    }
    
    try {
      this.adminKeypair = Keypair.fromSecretKey(bs58.decode(adminPrivateKey));
      console.log("Admin keypair initialized:", this.adminKeypair.publicKey.toBase58());
    } catch (error) {
      throw new Error("Invalid ADMIN_PRIVATE_KEY format");
    }
  }

  // Create or get project
  async getOrCreateProject() {
    if (!this.adminKeypair) {
      this.initializeAdmin();
    }

    try {
      // Try to find existing project
      const projects = await client.findProjects();
      let project = projects.find(p => p.name === GAME_CONFIG.projectName);

      if (!project) {
        // Create new project
        const { createCreateProjectTransaction: { project: projectAddress, tx: txResponse } } = 
          await client.createCreateProjectTransaction({
            name: GAME_CONFIG.projectName,
            authority: this.adminKeypair.publicKey.toBase58(),
            payer: this.adminKeypair.publicKey.toBase58(),
            profileDataConfig: {
              achievements: ["Honey Master", "Speed Runner", "Survivor"],
              customDataFields: ["Total Stages", "Best Time", "Honey Collected"]
            }
          });

        const response = await sendClientTransactions([txResponse], this.adminKeypair);

        project = { address: projectAddress };
        console.log("New project created:", project.address);
      } else {
        console.log("Existing project found:", project.address);
      }

      this.projectId = project.address;
      return project;
    } catch (error) {
      console.error("Error getting/creating project:", error);
      throw error;
    }
  }

  // Create user
  async createUser(walletAddress, username) {
    if (!this.adminKeypair) {
      this.initializeAdmin();
    }

    try {
      const { createNewUserTransaction: { tx: txResponse } } = 
        await client.createNewUserTransaction({
          wallet: walletAddress,
          info: {
            name: username,
            bio: "CrossRoad Bee Game Player",
            pfp: "https://your-cdn.com/default-avatar.png"
          },
          payer: this.adminKeypair.publicKey.toBase58()
        });

      const response = await sendClientTransactions([txResponse], this.adminKeypair);

      console.log("User created:", response);
      return response;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }



  // Create mission
  async createMission(missionConfig) {
    if (!this.adminKeypair) {
      this.initializeAdmin();
    }

    try {
      const { createCreateMissionTransaction: { tx: txResponse } } = 
        await client.createCreateMissionTransaction({
          name: missionConfig.name,
          description: missionConfig.description,
          duration: missionConfig.duration,
          targetAmount: missionConfig.targetAmount,
          resourceType: missionConfig.resourceType,
          rewardXP: missionConfig.rewardXP,
          rewardHoney: missionConfig.rewardHoney,
          authority: this.adminKeypair.publicKey,
          payer: this.adminKeypair.publicKey
        });

      const response = await sendClientTransactions([txResponse], this.adminKeypair);

      console.log("Mission created:", response);
      return response;
    } catch (error) {
      console.error("Error creating mission:", error);
      throw error;
    }
  }







  // Get user data
  async getUserData(walletAddress) {
    try {
      const users = await client.findUsers();
      const user = users.find(u => u.authority === walletAddress);
      return user;
    } catch (error) {
      console.error("Error getting user data:", error);
      throw error;
    }
  }

  // Get character data
  async getCharacterData(characterId) {
    try {
      const characters = await client.findCharacters();
      const character = characters.find(c => c.address === characterId);
      return character;
    } catch (error) {
      console.error("Error getting character data:", error);
      throw error;
    }
  }




}

export default new HoneycombService();
