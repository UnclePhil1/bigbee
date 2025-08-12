import { supabase } from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

// Function to check database connectivity and table structure
export async function checkDatabaseSetup() {
  console.log("Checking database setup...");
  
  try {
    // Test basic connectivity
    const { error } = await supabase
      .from("multiplayer_sessions")
      .select("count")
      .limit(1);
    
    if (error) {
      console.error("Database connectivity error:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Database connectivity: OK");
    
    // Test table structure by trying to select all columns
    const { error: structureError } = await supabase
      .from("multiplayer_sessions")
      .select("*")
      .limit(1);
    
    if (structureError) {
      console.error("Table structure error:", structureError);
      return { success: false, error: structureError.message };
    }
    
    console.log("Table structure: OK");
    return { success: true };
    
  } catch (err) {
    console.error("Database check failed:", err);
    return { success: false, error: err };
  }
}

export async function createSession({ code, wallet, username }: { code: string, wallet: string, username: string }) {
  console.log("Creating session with:", { code, wallet, username });
  return supabase.from("multiplayer_sessions").insert([
    { code, host_wallet: wallet, host_username: username }
  ]);
}

export async function joinSession({ code, wallet, username }: { code: string, wallet: string, username: string }) {
  console.log("=== JOINING SESSION ===");
  console.log("Code:", code);
  console.log("Wallet:", wallet);
  console.log("Username:", username);
  
  try {
    // First, let's check if the session exists
    const { data: existingSession, error: fetchError } = await supabase
      .from("multiplayer_sessions")
      .select("*")
      .eq("code", code)
      .single();
    
    console.log("Existing session:", existingSession);
    console.log("Fetch error:", fetchError);
    
    if (fetchError) {
      console.error("Error fetching session:", fetchError);
      return { data: null, error: fetchError };
    }
    
    if (!existingSession) {
      console.error("Session not found");
      return { data: null, error: { message: "Session not found" } };
    }
    
    // Check if challenger already exists
    if (existingSession.challenger_wallet) {
      console.log("Challenger already exists:", existingSession.challenger_wallet);
      return { data: existingSession, error: { message: "Session already has a challenger" } };
    }
    
    // Now try to update
    const updateData = { 
      challenger_wallet: wallet, 
      challenger_username: username 
    };
    
    console.log("Updating session with:", updateData);
    
    const result = await supabase.from("multiplayer_sessions")
      .update(updateData)
      .eq("code", code)
      .select();
    
    console.log("Update result:", result);
    
    if (result.error) {
      console.error("Error updating session:", result.error);
      return result;
    }
    
    console.log("Successfully joined session:", result.data);
    return result;
  } catch (err) {
    console.error("Exception joining session:", err);
    return { data: null, error: { message: `Exception: ${err}` } };
  }
}

export async function startSession(code: string) {
  console.log("=== STARTING SESSION ===");
  console.log("Code:", code);
  
  try {
    // First check if session exists and has a challenger
    const { data: sessionCheck, error: checkError } = await supabase
      .from("multiplayer_sessions")
      .select("*")
      .eq("code", code)
      .single();
    
    if (checkError) {
      console.error("Error checking session:", checkError);
      return { data: null, error: checkError };
    }
    
    if (!sessionCheck) {
      console.error("Session not found");
      return { data: null, error: { message: "Session not found" } };
    }
    
    if (!sessionCheck.challenger_wallet) {
      console.error("No challenger joined yet");
      return { data: null, error: { message: "No challenger has joined yet" } };
    }
    
    console.log("Session and challenger found, starting session...");
    
    const result = await supabase.from("multiplayer_sessions")
      .update({ started: true })
      .eq("code", code)
      .select();
    
    console.log("Start session result:", result);
    
    if (result.error) {
      console.error("Error starting session:", result.error);
      return { data: null, error: result.error };
    }
    
    console.log("Session started successfully:", result.data);
    return result;
  } catch (err) {
    console.error("Exception starting session:", err);
    return { data: null, error: { message: `Exception: ${err}` } };
  }
}

export async function setWinner(code: string, winner_wallet: string) {
  return supabase.from("multiplayer_sessions")
    .update({ winner_wallet })
    .eq("code", code);
}

export async function updatePlayerScore(code: string, wallet: string, score: number) {
  return supabase.from("multiplayer_sessions")
    .update({ 
      [`${wallet === 'host' ? 'host_score' : 'challenger_score'}`]: score 
    })
    .eq("code", code);
}

export async function updatePlayerPosition(code: string, wallet: string, position: { row: number, tile: number, progress: number }) {
  return supabase.from("multiplayer_sessions")
    .update({ 
      [`${wallet === 'host' ? 'host_position' : 'challenger_position'}`]: position 
    })
    .eq("code", code);
}

export async function startRace(code: string) {
  return supabase.from("multiplayer_sessions")
    .update({ race_started: true })
    .eq("code", code);
}

export async function finishRace(code: string, winner_wallet: string, host_finish_time?: number, challenger_finish_time?: number) {
  const updateData: any = { 
    race_finished: true,
    winner_wallet 
  };
  
  if (host_finish_time !== undefined) {
    updateData.host_finish_time = host_finish_time;
  }
  if (challenger_finish_time !== undefined) {
    updateData.challenger_finish_time = challenger_finish_time;
  }
  
  return supabase.from("multiplayer_sessions")
    .update(updateData)
    .eq("code", code);
}

export function subscribeToSession(code: string, callback: (payload: any) => void): RealtimeChannel {
  console.log("=== SETTING UP SESSION SUBSCRIPTION ===");
  console.log("Code:", code);
  console.log("Callback function:", callback);
  
  const channel = supabase.channel(`multiplayer_sessions:${code}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "multiplayer_sessions", filter: `code=eq.${code}` },
      payload => {
        console.log("=== SUPABASE REALTIME PAYLOAD ===");
        console.log("Payload:", payload);
        console.log("Event type:", payload.eventType);
        console.log("New record:", payload.new);
        console.log("Old record:", payload.old);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log("=== SUBSCRIPTION STATUS ===");
      console.log("Status:", status);
    });
  
  console.log("Channel created:", channel);
  return channel;
}

export function subscribeToPlayerUpdates(code: string, callback: (payload: any) => void): RealtimeChannel {
  const channel = supabase.channel(`player_updates:${code}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "multiplayer_sessions", filter: `code=eq.${code}` },
      payload => callback(payload)
    )
    .subscribe();
  return channel;
}

export function unsubscribeFromSession(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}



