export interface Player {
  wallet: string;
  username: string;
  x: number;
  y: number;
  isHost: boolean;
  isReady: boolean;
}

export interface GameSession {
  code: string;
  host_wallet: string;
  host_username: string;
  challenger_wallet?: string;
  challenger_username?: string;
  started: boolean;
  winner_wallet?: string;
  host_score?: number;
  challenger_score?: number;
  host_position?: { row: number; tile: number; progress: number };
  challenger_position?: { row: number; tile: number; progress: number };
  race_started?: boolean;
  race_finished?: boolean;
  host_finish_time?: number;
  challenger_finish_time?: number;
}