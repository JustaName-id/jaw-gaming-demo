import { useAccount } from 'wagmi';
import { useDisconnect } from '@jaw.id/wagmi';
import { Account } from '@jaw.id/core';
import { useState, useCallback } from 'react';
import { ConnectScreen } from './components/ConnectScreen';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';

type JawAccount = Awaited<ReturnType<typeof Account.fromLocalAccount>>;
type GameState = 'disconnected' | 'connected' | 'playing' | 'gameover';

function App() {
  const { isConnected } = useAccount();
  const { mutate: disconnect } = useDisconnect();
  const [gameState, setGameState] = useState<GameState>('disconnected');
  const [permissionId, setPermissionId] = useState<`0x${string}` | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState(0);
  const [accessKeyAccount, setAccessKeyAccount] = useState<JawAccount | null>(null);
  const [totalClicks, setTotalClicks] = useState(0);

  const effectiveState: GameState = !isConnected
    ? 'disconnected'
    : gameState === 'disconnected'
      ? 'connected'
      : gameState;

  const handlePermissionGranted = useCallback((id: `0x${string}`, expiry: number, account: JawAccount) => {
    setPermissionId(id);
    setSessionExpiry(expiry);
    setAccessKeyAccount(account);
    setGameState('playing');
  }, []);

  const handleSessionExpired = useCallback((clicks: number) => {
    setTotalClicks(clicks);
    setGameState('gameover');
  }, []);

  const handleNewSession = useCallback(() => {
    setPermissionId(null);
    setSessionExpiry(0);
    setAccessKeyAccount(null);
    setGameState('connected');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Arcade Coin Clicker</h1>
        {isConnected && (
          <button className="btn btn-small" onClick={() => disconnect({})}>
            Disconnect
          </button>
        )}
      </header>

      <main className="app-main">
        {effectiveState === 'disconnected' && <ConnectScreen />}
        {effectiveState === 'connected' && (
          <SetupScreen onPermissionGranted={handlePermissionGranted} />
        )}
        {effectiveState === 'playing' && permissionId && accessKeyAccount && (
          <GameScreen
            permissionId={permissionId}
            accessKeyAccount={accessKeyAccount}
            sessionExpiry={sessionExpiry}
            onSessionExpired={handleSessionExpired}
          />
        )}
        {effectiveState === 'gameover' && (
          <GameOverScreen clicks={totalClicks} onNewSession={handleNewSession} />
        )}
      </main>
    </div>
  );
}

export default App;
