import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createRaceSession, joinRaceSession, getRaceSession, startRace as startRaceSession, subscribeToRaceSession, type RaceSession } from '@/lib/multiplayerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Copy, Check, ArrowLeft, Play, UserPlus } from 'lucide-react';

interface MultiplayerLobbyProps {
  onStartGame: (sessionCode: string, isHost: boolean) => void;
  onBack: () => void;
}

export function MultiplayerLobby({ onStartGame, onBack }: MultiplayerLobbyProps) {
  const { publicKey } = useWallet();
  const [mode, setMode] = useState<'menu' | 'host' | 'join' | 'waiting'>('menu');
  const [sessionCode, setSessionCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState<RaceSession | null>(null);
  const [joinedSessionCode, setJoinedSessionCode] = useState('');

  const createSession = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const code = await createRaceSession(publicKey.toBase58(), 'Player');
      
      if (!code) {
        throw new Error('Failed to create session');
      }

      setSessionCode(code);
      setMode('host');
      
      const unsubscribe = subscribeToRaceSession(code, (session) => {
        setSessionData(session);
        
        // Check if race started and redirect both players
        if (session.race_started) {
          console.log('Race started! Redirecting to racing canvas...');
          onStartGame(code, true);
        }
      });
      
      return () => unsubscribe();
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error('Error creating session:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const joinSession = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Check if session exists
      const session = await getRaceSession(sessionCode.toUpperCase());
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.race_started) {
        throw new Error('Race has already started');
      }

      if (session.challenger_wallet) {
        throw new Error('Session is full');
      }

      // Join the session
      const success = await joinRaceSession(sessionCode.toUpperCase(), publicKey.toBase58(), 'Challenger');

      if (!success) {
        throw new Error('Failed to join session');
      }

      // Set the joined session code and switch to waiting mode
      setJoinedSessionCode(sessionCode.toUpperCase());
      setMode('waiting');
      setSessionData(session);

      // Subscribe to session updates for challenger
      const unsubscribe = subscribeToRaceSession(sessionCode.toUpperCase(), (session) => {
        setSessionData(session);
        // Check if race started and redirect challenger
        if (session.race_started) {
          console.log('Race started! Redirecting challenger to racing canvas...');
          onStartGame(sessionCode.toUpperCase(), false);
        }
      });

      // Cleanup subscription when component unmounts
      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      console.error('Error joining session:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const startRace = async () => {
    if (!sessionCode) return;

    try {
      console.log('Starting race for session:', sessionCode);
      const success = await startRaceSession(sessionCode);

      if (!success) {
        throw new Error('Failed to start race');
      }

      console.log('Race start command sent successfully');
      // Don't redirect immediately - let the real-time subscription handle it
      // The race will start and both players will be redirected together
    } catch (err) {
      setError('Failed to start race');
      console.error('Error starting race:', err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleBack = () => {
    setMode('menu');
    setSessionCode('');
    setJoinedSessionCode('');
    setError('');
    setSessionData(null);
  };

  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black bg-opacity-90 border-yellow-500 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-center font-['Press_Start_2P'] text-xl">
              🐝 Bee Racing Challenge
            </CardTitle>
            <p className="text-gray-400 text-center text-sm mt-2">
              Race against your friends in this exciting multiplayer bee adventure!
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center text-gray-300 text-sm bg-gray-800 p-4 rounded-lg border border-gray-600">
              <p className="text-yellow-400 font-semibold mb-2">🏁 Race Rules</p>
              <p>• First bee to reach the finish line wins!</p>
              <p>• Avoid vehicles and obstacles</p>
              <p>• Use WASD or arrow keys to move</p>
            </div>
            
            <Button 
              onClick={() => setMode('host')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-['Press_Start_2P'] py-6 text-lg shadow-lg"
            >
              <Users className="w-6 h-6 mr-2" />
              Host Bee Race
            </Button>
            
            <Button 
              onClick={() => setMode('join')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-['Press_Start_2P'] py-6 text-lg shadow-lg"
            >
              <UserPlus className="w-6 h-6 mr-2" />
              Join Bee Race
            </Button>
            
            <Button 
              onClick={onBack}
              variant="outline"
              className="w-full border-gray-500 text-gray-300 hover:bg-gray-800 font-['Press_Start_2P']"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Main Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'host') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black bg-opacity-90 border-yellow-500 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-center font-['Press_Start_2P']">
              🐝 Host Bee Race
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!sessionCode ? (
              <div className="text-center">
                <Button 
                  onClick={createSession}
                  disabled={isCreating}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-['Press_Start_2P'] py-6 text-lg shadow-lg"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      Creating Session...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Users className="w-6 h-6 mr-2" />
                      Create New Race
                    </div>
                  )}
                </Button>
                <p className="text-gray-400 text-sm mt-3">Create a new racing session and invite friends</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <Label className="text-white text-sm font-semibold">Session Code</Label>
                  <div className="flex items-center justify-center mt-3">
                    <Input
                      value={sessionCode}
                      readOnly
                      className="text-center font-mono text-2xl bg-gray-800 border-yellow-500 text-yellow-400 py-4"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="ml-3 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black h-12 w-12"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Share this code with your friend</p>
                </div>
                
                <div className="text-center text-gray-300 text-sm bg-gray-800 p-4 rounded-lg border border-gray-600">
                  <p className="text-yellow-400 font-semibold mb-2">🐝 Race Rules</p>
                  <p>• First bee to reach the finish line wins!</p>
                  <p>• Avoid vehicles and obstacles</p>
                  <p>• Use WASD or arrow keys to move</p>
                </div>

                {/* Player List */}
                {sessionData && (
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <h3 className="text-white font-['Press_Start_2P'] text-sm mb-4 text-center">Players</h3>
                    <div className="space-y-3">
                      {/* Host Player */}
                      <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-yellow-500">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-lg">
                          👑
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{sessionData.host_username}</div>
                          <div className="text-yellow-400 text-xs">Host</div>
                        </div>
                        <div className="text-green-400 text-xs bg-green-900 px-2 py-1 rounded">Ready</div>
                      </div>
                      
                      {/* Challenger Player */}
                      {sessionData.challenger_username ? (
                        <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-blue-500 animate-pulse">
                          <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-black font-bold text-lg">
                            🐝
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">{sessionData.challenger_username}</div>
                            <div className="text-blue-400 text-xs">Challenger</div>
                          </div>
                          <div className="text-green-400 text-xs bg-green-900 px-2 py-1 rounded">Ready</div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-gray-500 opacity-60">
                          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-400">Waiting for challenger...</div>
                            <div className="text-gray-500 text-xs">Not joined yet</div>
                          </div>
                          <div className="text-yellow-400 text-xs bg-yellow-900 px-2 py-1 rounded">Waiting</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={startRace}
                  disabled={!sessionData?.challenger_wallet}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-['Press_Start_2P'] py-6 text-lg shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="w-6 h-6 mr-2" />
                  {!sessionData?.challenger_wallet ? '⏳ Waiting for Challenger...' : '🚀 Start Race!'}
                </Button>
              </div>
            )}
            
            {error && (
              <div className="text-red-400 text-center text-sm bg-red-900 bg-opacity-20 p-3 rounded-lg border border-red-500">
                {error}
              </div>
            )}
            
            <Button 
              onClick={handleBack}
              variant="outline"
              className="w-full border-gray-500 text-gray-300 hover:bg-gray-800 font-['Press_Start_2P']"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black bg-opacity-90 border-blue-500 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-center font-['Press_Start_2P']">
              🐝 Join Bee Race
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center text-gray-300 text-sm bg-gray-800 p-4 rounded-lg border border-gray-600">
              <p className="text-blue-400 font-semibold mb-2">📋 How to Join</p>
              <p>• Ask your friend for the 6-digit session code</p>
              <p>• Enter the code below and click "Join Race"</p>
              <p>• Wait for the host to start the race</p>
            </div>
            
            <div>
              <Label htmlFor="sessionCode" className="text-white text-sm font-semibold">
                Enter Session Code
              </Label>
              <Input
                id="sessionCode"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="mt-3 text-center font-mono text-2xl bg-gray-800 border-blue-500 text-blue-400 py-4"
                maxLength={6}
              />
            </div>
            
            <Button 
              onClick={joinSession}
              disabled={isJoining || !sessionCode.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-['Press_Start_2P'] py-6 text-lg shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isJoining ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Joining Race...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus className="w-6 h-6 mr-2" />
                  Join Race
                </div>
              )}
            </Button>
            
            {error && (
              <div className="text-red-400 text-center text-sm bg-red-900 bg-opacity-20 p-3 rounded-lg border border-red-500">
                {error}
              </div>
            )}
            
            <Button 
              onClick={handleBack}
              variant="outline"
              className="w-full border-gray-500 text-gray-300 hover:bg-gray-800 font-['Press_Start_2P']"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black bg-opacity-90 border-blue-500 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-center font-['Press_Start_2P']">
              🐝 Waiting for Host
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-blue-400 text-sm mb-2">Session Code</div>
              <div className="text-2xl font-mono text-blue-300 bg-gray-800 p-3 rounded-lg border border-blue-500">
                {joinedSessionCode}
              </div>
            </div>
            
            <div className="text-center text-gray-300 text-sm space-y-2">
              <p>✅ Successfully joined the race!</p>
              <p>Waiting for host to start the race...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            </div>
            
            {/* Player List */}
            {sessionData && (
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                <h3 className="text-white font-['Press_Start_2P'] text-sm mb-3 text-center">Players</h3>
                <div className="space-y-3">
                  {/* Host Player */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-yellow-500">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-lg">
                      👑
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{sessionData.host_username}</div>
                      <div className="text-yellow-400 text-xs">Host</div>
                    </div>
                    <div className="text-green-400 text-xs bg-green-900 px-2 py-1 rounded">Ready</div>
                  </div>
                  
                  {/* Challenger Player (You) */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg border border-blue-500">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-black font-bold text-lg">
                      🐝
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">You (Challenger)</div>
                      <div className="text-blue-400 text-xs">Challenger</div>
                    </div>
                    <div className="text-green-400 text-xs bg-green-900 px-2 py-1 rounded">Ready</div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-yellow-400 text-sm bg-yellow-900 bg-opacity-20 p-3 rounded-lg">
              🏁 First bee to reach the finish line wins! 🏁
            </div>
            
            <Button 
              onClick={handleBack}
              variant="outline"
              className="w-full border-gray-500 text-gray-300 hover:bg-gray-800 font-['Press_Start_2P']"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Leave Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
