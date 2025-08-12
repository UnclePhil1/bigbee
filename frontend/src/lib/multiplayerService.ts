import { supabase } from './supabaseClient';

export interface RaceSession {
  code: string;
  host_wallet: string;
  host_username: string;
  challenger_wallet?: string;
  challenger_username?: string;
  started: boolean;
  race_started: boolean;
  race_finished: boolean;
  winner_wallet?: string;
  host_score: number;
  challenger_score: number;
  host_position: { row: number; tile: number; progress: number };
  challenger_position: { row: number; tile: number; progress: number };
  host_finish_time?: number;
  challenger_finish_time?: number;
  created_at: string;
  updated_at: string;
}

export const createRaceSession = async (hostWallet: string, hostUsername: string): Promise<string | null> => {
  try {
    const code = generateSessionCode();
    
    const { error } = await supabase
      .from('multiplayer_sessions')
      .insert([{
        code,
        host_wallet: hostWallet,
        host_username: hostUsername,
        started: false,
        race_started: false,
        race_finished: false,
        host_score: 0,
        challenger_score: 0,
        host_position: { row: 0, tile: 0, progress: 0 },
        challenger_position: { row: 0, tile: 0, progress: 0 }
      }]);

    if (error) {
      console.error('Error creating race session:', error);
      return null;
    }

    return code;
  } catch (error) {
    console.error('Failed to create race session:', error);
    return null;
  }
};

export const joinRaceSession = async (code: string, challengerWallet: string, challengerUsername: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('multiplayer_sessions')
      .update({
        challenger_wallet: challengerWallet,
        challenger_username: challengerUsername
      })
      .eq('code', code.toUpperCase());

    if (error) {
      console.error('Error joining race session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to join race session:', error);
    return false;
  }
};

export const startRace = async (code: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('multiplayer_sessions')
      .update({
        started: true,
        race_started: true
      })
      .eq('code', code);

    if (error) {
      console.error('Error starting race:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to start race:', error);
    return false;
  }
};

export const updatePlayerPosition = async (
  code: string, 
  isHost: boolean, 
  position: { row: number; tile: number; progress: number }
): Promise<boolean> => {
  try {
    const updateData = isHost 
      ? { host_position: position }
      : { challenger_position: position };

    const { error } = await supabase
      .from('multiplayer_sessions')
      .update(updateData)
      .eq('code', code);

    if (error) {
      console.error('Error updating player position:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update player position:', error);
    return false;
  }
};

export const finishRace = async (
  code: string, 
  isHost: boolean, 
  finishTime: number
): Promise<boolean> => {
  try {
    const updateData = isHost 
      ? { host_finish_time: finishTime }
      : { challenger_finish_time: finishTime };

    const { error } = await supabase
      .from('multiplayer_sessions')
      .update(updateData)
      .eq('code', code);

    if (error) {
      console.error('Error finishing race:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to finish race:', error);
    return false;
  }
};

export const endRace = async (
  code: string, 
  winnerWallet: string, 
  hostScore: number, 
  challengerScore: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('multiplayer_sessions')
      .update({
        race_finished: true,
        winner_wallet: winnerWallet,
        host_score: hostScore,
        challenger_score: challengerScore
      })
      .eq('code', code);

    if (error) {
      console.error('Error ending race:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to end race:', error);
    return false;
  }
};

export const getRaceSession = async (code: string): Promise<RaceSession | null> => {
  try {
    const { data, error } = await supabase
      .from('multiplayer_sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      console.error('Error getting race session:', error);
      return null;
    }

    return data as RaceSession;
  } catch (error) {
    console.error('Failed to get race session:', error);
    return null;
  }
};

export const subscribeToRaceSession = (
  code: string, 
  onUpdate: (session: RaceSession) => void
) => {
  const channel = supabase
    .channel(`race_${code}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'multiplayer_sessions',
      filter: `code=eq.${code.toUpperCase()}`
    }, (payload) => {
      onUpdate(payload.new as RaceSession);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
