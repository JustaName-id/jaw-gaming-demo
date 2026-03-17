# Gaming Demo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a retro arcade coin-clicker demo that showcases JAW SDK's permission system — connect via passkey, grant a session to a temporary access key, click a coin to spend 0.1 USDC per click.

**Architecture:** Single-page Vite React app with a 4-state machine (disconnected → connected → permissioned → expired). Wagmi hooks handle the user's smart account; `Account.fromLocalAccount` handles the temporary access key that executes delegated transactions with a paymaster.

**Tech Stack:** Vite, React, TypeScript, @jaw.id/wagmi, @jaw.id/core, @jaw.id/ui, wagmi, viem, @tanstack/react-query

**Spec:** `docs/superpowers/specs/2026-03-17-gaming-demo-design.md`

---

## Chunk 1: Project Scaffolding & Configuration

### Task 1: Scaffold Vite React project and install dependencies

**Files:**
- Create: `package.json` (via Vite scaffold)
- Create: `.env`
- Create: `tsconfig.json` (via Vite scaffold)

- [ ] **Step 1: Scaffold Vite React TypeScript project**

```bash
cd /Users/ghadimhawej/Desktop/bga-demo
npm create vite@latest . -- --template react-ts
```

Accept overwriting existing files if prompted.

- [ ] **Step 2: Install dependencies**

```bash
npm install @jaw.id/wagmi @jaw.id/ui @jaw.id/core wagmi viem @tanstack/react-query
```

- [ ] **Step 3: Create .env with placeholders**

Create `.env` at project root:

```
VITE_JAW_API_KEY=your-jaw-api-key
VITE_ENS_DOMAIN=your-ens-domain.eth
VITE_ETHERSPOT_API_KEY=your-etherspot-api-key
```

- [ ] **Step 4: Verify project builds**

```bash
npm run dev
```

Expected: Vite dev server starts on localhost.

- [ ] **Step 5: Commit**

```bash
git init
echo "node_modules\ndist\n.env" > .gitignore
git add .
git commit -m "chore: scaffold Vite React TS project with JAW SDK deps"
```

---

### Task 2: Wagmi config and constants

**Files:**
- Create: `src/config/wagmi.ts`
- Create: `src/config/constants.ts`

- [ ] **Step 1: Create constants file**

Create `src/config/constants.ts`:

```typescript
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export const GAME_TREASURY = '0x000000000000000000000000000000000000dEaD' as const;

export const USDC_DECIMALS = 6;

export const COST_PER_CLICK = '0.1'; // in USDC

export const SESSION_DURATION = 3600; // 1 hour in seconds

export const SPEND_LIMIT = '2'; // 2 USDC per hour

export const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
```

- [ ] **Step 2: Create wagmi config**

Create `src/config/wagmi.ts`:

```typescript
import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { jaw } from '@jaw.id/wagmi';
import { Mode } from '@jaw.id/core';
import { ReactUIHandler } from '@jaw.id/ui';

const paymasterUrl = `https://rpc.etherspot.io/paymaster/?api-key=${import.meta.env.VITE_ETHERSPOT_API_KEY}&useVp=true`;

export const jawConnector = jaw({
  apiKey: import.meta.env.VITE_JAW_API_KEY,
  appName: 'Arcade Coin Clicker',
  defaultChainId: 84532,
  ens: import.meta.env.VITE_ENS_DOMAIN,
  paymasters: {
    84532: { url: paymasterUrl },
  },
  preference: {
    mode: Mode.AppSpecific,
    uiHandler: new ReactUIHandler(),
    showTestnets: true,
  },
});

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [jawConnector],
  transports: {
    [baseSepolia.id]: http(),
  },
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (or only unrelated Vite template errors).

- [ ] **Step 4: Commit**

```bash
git add src/config/
git commit -m "feat: add wagmi config with JAW connector and constants"
```

---

### Task 3: App providers and entry point

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Set up providers in main.tsx**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
```

- [ ] **Step 2: Create minimal App.tsx with state machine**

Replace `src/App.tsx`:

```tsx
import { useAccount } from 'wagmi';
import { useState } from 'react';

type GameState = 'disconnected' | 'connected' | 'playing' | 'gameover';

function App() {
  const { isConnected } = useAccount();
  const [gameState, setGameState] = useState<GameState>('disconnected');
  const [permissionId, setPermissionId] = useState<`0x${string}` | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number>(0);

  // Sync disconnect
  const effectiveState = !isConnected ? 'disconnected' : gameState === 'disconnected' ? 'connected' : gameState;

  return (
    <div className="app">
      <h1>Arcade Coin Clicker</h1>
      <p>State: {effectiveState}</p>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Verify dev server renders**

```bash
npm run dev
```

Expected: Page shows "Arcade Coin Clicker" and "State: disconnected".

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: set up wagmi providers and app state machine shell"
```

---

## Chunk 2: Access Key Hook & Connect/Setup Screens

### Task 4: useAccessKey hook

**Files:**
- Create: `src/hooks/useAccessKey.ts`

- [ ] **Step 1: Create the access key hook**

Create `src/hooks/useAccessKey.ts`:

```typescript
import { useState, useCallback } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Account } from '@jaw.id/core';

const STORAGE_KEY = 'AccessKeys';

const paymasterUrl = `https://rpc.etherspot.io/paymaster/?api-key=${import.meta.env.VITE_ETHERSPOT_API_KEY}&useVp=true`;

const accountConfig = {
  chainId: 84532,
  apiKey: import.meta.env.VITE_JAW_API_KEY,
  paymasterUrl,
};

export function useAccessKey() {
  const [account, setAccount] = useState<Awaited<ReturnType<typeof Account.fromLocalAccount>> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createAccessKey = useCallback(async () => {
    setIsCreating(true);
    try {
      const privateKey = generatePrivateKey();
      localStorage.setItem(STORAGE_KEY, privateKey);
      const localAccount = privateKeyToAccount(privateKey);
      const jawAccount = await Account.fromLocalAccount(accountConfig, localAccount);
      setAccount(jawAccount);
      return jawAccount;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { account, isCreating, createAccessKey };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAccessKey.ts
git commit -m "feat: add useAccessKey hook for access key lifecycle"
```

---

### Task 5: ConnectScreen component

**Files:**
- Create: `src/components/ConnectScreen.tsx`

- [ ] **Step 1: Create ConnectScreen**

Create `src/components/ConnectScreen.tsx`:

```tsx
import { useConnect } from '@jaw.id/wagmi';
import { config } from '../config/wagmi';

export function ConnectScreen() {
  const { mutate: connect, isPending } = useConnect();

  const handleConnect = () => {
    connect({ connector: config.connectors[0] });
  };

  return (
    <div className="screen connect-screen">
      <div className="logo">🎮</div>
      <h2>Arcade Coin Clicker</h2>
      <p className="subtitle">Spend USDC with every click!</p>
      <button
        className="btn btn-primary"
        onClick={handleConnect}
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : 'Sign Up / Login'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ConnectScreen.tsx
git commit -m "feat: add ConnectScreen component"
```

---

### Task 6: SetupScreen component

**Files:**
- Create: `src/components/SetupScreen.tsx`

- [ ] **Step 1: Create SetupScreen**

Create `src/components/SetupScreen.tsx`:

```tsx
import { useAccount } from 'wagmi';
import { useGrantPermissions } from '@jaw.id/wagmi';
import { Account } from '@jaw.id/core';
import { parseUnits } from 'viem';
import { useAccessKey } from '../hooks/useAccessKey';
import {
  USDC_ADDRESS,
  SESSION_DURATION,
  SPEND_LIMIT,
  USDC_DECIMALS,
} from '../config/constants';

type JawAccount = Awaited<ReturnType<typeof Account.fromLocalAccount>>;

interface SetupScreenProps {
  onPermissionGranted: (permissionId: `0x${string}`, expiry: number, account: JawAccount) => void;
}

export function SetupScreen({ onPermissionGranted }: SetupScreenProps) {
  const { address } = useAccount();
  const { isCreating, createAccessKey } = useAccessKey();
  const { mutate: grant, isPending: isGranting } = useGrantPermissions();

  const handleGetStarted = async () => {
    const jawAccount = await createAccessKey();
    const expiry = Math.floor(Date.now() / 1000) + SESSION_DURATION;

    grant({
      end: expiry,
      spender: jawAccount.address,
      permissions: {
        calls: [{
          target: USDC_ADDRESS,
          functionSignature: 'transfer(address,uint256)',
        }],
        spends: [{
          token: USDC_ADDRESS,
          allowance: parseUnits(SPEND_LIMIT, USDC_DECIMALS).toString(),
          unit: 'hour',
        }],
      },
    }, {
      onSuccess: (data) => {
        onPermissionGranted(data.permissionId, expiry, jawAccount);
      },
    });
  };

  const isLoading = isCreating || isGranting;

  return (
    <div className="screen setup-screen">
      <h2>Welcome!</h2>
      <p className="address">{address}</p>
      <p className="info">
        Grant a session to play. Each click costs 0.1 USDC.
        Sessions last 1 hour with a 2 USDC limit.
      </p>
      <button
        className="btn btn-primary"
        onClick={handleGetStarted}
        disabled={isLoading}
      >
        {isCreating ? 'Creating session key...' : isGranting ? 'Granting permission...' : 'Get Started'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SetupScreen.tsx
git commit -m "feat: add SetupScreen with permission grant flow"
```

---

## Chunk 3: Game Screen & Core Gameplay

### Task 7: Coin component

**Files:**
- Create: `src/components/Coin.tsx`

- [ ] **Step 1: Create animated Coin component**

Create `src/components/Coin.tsx`:

```tsx
interface CoinProps {
  onClick: () => void;
  disabled: boolean;
}

export function Coin({ onClick, disabled }: CoinProps) {
  return (
    <button
      className={`coin ${disabled ? 'coin-disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="coin-face">$</span>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Coin.tsx
git commit -m "feat: add animated Coin component"
```

---

### Task 8: useGame hook

**Files:**
- Create: `src/hooks/useGame.ts`

- [ ] **Step 1: Create useGame hook**

Create `src/hooks/useGame.ts`:

```typescript
import { useState, useCallback } from 'react';
import { Account } from '@jaw.id/core';
import { encodeFunctionData, parseUnits } from 'viem';
import { USDC_ADDRESS, USDC_ABI, GAME_TREASURY, USDC_DECIMALS, COST_PER_CLICK } from '../config/constants';

type JawAccount = Awaited<ReturnType<typeof Account.fromLocalAccount>>;

export function useGame(
  permissionId: `0x${string}` | null,
  accessKeyAccount: JawAccount | null,
) {
  const [isSending, setIsSending] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [txConfirmed, setTxConfirmed] = useState(0); // increments on each confirmed tx

  const handleClick = useCallback(async () => {
    if (!permissionId || !accessKeyAccount) return;
    setIsSending(true);
    setError(null);

    try {
      const { id } = await accessKeyAccount.sendCalls(
        [{
          to: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: USDC_ABI,
            functionName: 'transfer',
            args: [GAME_TREASURY, parseUnits(COST_PER_CLICK, USDC_DECIMALS)],
          }),
        }],
        { permissionId },
      );

      // Poll for completion
      let status = accessKeyAccount.getCallStatus(id);
      while (status.status === 100) {
        await new Promise((r) => setTimeout(r, 1000));
        status = accessKeyAccount.getCallStatus(id);
      }

      if (status.status === 200) {
        setClicks((c) => c + 1);
        setTxConfirmed((c) => c + 1);
      } else {
        setError(`Transaction failed (status: ${status.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  }, [permissionId, accessKeyAccount]);

  return { isSending, clicks, error, txConfirmed, handleClick };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useGame.ts
git commit -m "feat: add useGame hook with sendCalls and status polling"
```

---

### Task 9: GameScreen component

**Files:**
- Create: `src/components/GameScreen.tsx`

- [ ] **Step 1: Create GameScreen**

Create `src/components/GameScreen.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Account } from '@jaw.id/core';
import { Coin } from './Coin';
import { useGame } from '../hooks/useGame';
import { USDC_ADDRESS, USDC_ABI, USDC_DECIMALS } from '../config/constants';

type JawAccount = Awaited<ReturnType<typeof Account.fromLocalAccount>>;

interface GameScreenProps {
  permissionId: `0x${string}`;
  accessKeyAccount: JawAccount;
  sessionExpiry: number;
  onSessionExpired: (clicks: number) => void;
}

export function GameScreen({ permissionId, accessKeyAccount, sessionExpiry, onSessionExpired }: GameScreenProps) {
  const { address } = useAccount();
  const { isSending, clicks, error, txConfirmed, handleClick } = useGame(permissionId, accessKeyAccount);
  const [timeLeft, setTimeLeft] = useState('');

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Refresh balance after each confirmed tx
  useEffect(() => {
    if (txConfirmed > 0) {
      refetchBalance();
    }
  }, [txConfirmed, refetchBalance]);

  // Check for zero balance → game over
  useEffect(() => {
    if (balance !== undefined && (balance as bigint) === 0n) {
      onSessionExpired(clicks);
    }
  }, [balance, clicks, onSessionExpired]);

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const remaining = sessionExpiry - Math.floor(Date.now() / 1000);
      if (remaining <= 0) {
        onSessionExpired(clicks);
        return;
      }
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionExpiry, clicks, onSessionExpired]);

  const displayBalance = balance !== undefined
    ? formatUnits(balance as bigint, USDC_DECIMALS)
    : '...';

  return (
    <div className="screen game-screen">
      <div className="game-hud">
        <div className="hud-item">
          <span className="hud-label">Balance</span>
          <span className="hud-value">{displayBalance} USDC</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Clicks</span>
          <span className="hud-value">{clicks}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Time Left</span>
          <span className="hud-value">{timeLeft}</span>
        </div>
      </div>

      <Coin onClick={handleClick} disabled={isSending} />

      {isSending && <p className="status">Sending transaction...</p>}
      {error && <p className="status error">{error}</p>}
      <p className="hint">Click the coin! Each click costs 0.1 USDC</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameScreen.tsx
git commit -m "feat: add GameScreen with coin, balance, and timer"
```

---

## Chunk 4: Game Over, Full Wiring & Styling

### Task 10: GameOverScreen component

**Files:**
- Create: `src/components/GameOverScreen.tsx`

- [ ] **Step 1: Create GameOverScreen**

Create `src/components/GameOverScreen.tsx`:

```tsx
interface GameOverScreenProps {
  clicks: number;
  onNewSession: () => void;
}

export function GameOverScreen({ clicks, onNewSession }: GameOverScreenProps) {
  return (
    <div className="screen gameover-screen">
      <h2>Game Over!</h2>
      <p className="final-score">You clicked {clicks} times</p>
      <button className="btn btn-primary" onClick={onNewSession}>
        New Session
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameOverScreen.tsx
git commit -m "feat: add GameOverScreen component"
```

---

### Task 11: Wire up App.tsx with all screens

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Complete App.tsx state machine**

Replace `src/App.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up full state machine with all screens"
```

---

### Task 12: Retro arcade styling

**Files:**
- Modify: `src/index.css`
- Delete: `src/App.css` (if exists)

- [ ] **Step 1: Replace index.css with arcade theme**

Replace `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

:root {
  --bg: #0a0a1a;
  --text: #e0e0ff;
  --neon-green: #39ff14;
  --neon-pink: #ff6ec7;
  --neon-yellow: #fff200;
  --gold: #ffd700;
  --btn-bg: #1a1a3e;
  --btn-hover: #2a2a5e;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Press Start 2P', monospace;
  background-color: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#root {
  width: 100%;
  max-width: 600px;
  padding: 1rem;
}

.app {
  text-align: center;
}

.app-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
}

.app-header h1 {
  font-size: 1.2rem;
  color: var(--neon-pink);
  text-shadow: 0 0 10px var(--neon-pink), 0 0 20px var(--neon-pink);
}

.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1rem;
}

.logo {
  font-size: 4rem;
}

h2 {
  font-size: 1rem;
  color: var(--neon-green);
  text-shadow: 0 0 8px var(--neon-green);
}

.subtitle, .info, .hint {
  font-size: 0.6rem;
  line-height: 1.8;
  color: #aaa;
  max-width: 400px;
}

.address {
  font-size: 0.5rem;
  color: var(--neon-yellow);
  word-break: break-all;
}

.btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  padding: 1rem 2rem;
  border: 2px solid var(--neon-green);
  background: var(--btn-bg);
  color: var(--neon-green);
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  background: var(--btn-hover);
  box-shadow: 0 0 15px var(--neon-green);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  border-color: var(--neon-pink);
  color: var(--neon-pink);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 0 15px var(--neon-pink);
}

.btn-small {
  font-size: 0.5rem;
  padding: 0.5rem 1rem;
  position: absolute;
  right: 0;
}

/* Coin */
.coin {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe066, var(--gold), #b8860b);
  border: 4px solid #b8860b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
  animation: bounce 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.coin:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
}

.coin:active:not(:disabled) {
  transform: scale(0.95);
}

.coin-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  animation: none;
}

.coin-face {
  font-size: 3rem;
  font-family: 'Press Start 2P', monospace;
  color: #b8860b;
  text-shadow: 1px 1px 0 #ffe066;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* HUD */
.game-hud {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.hud-label {
  font-size: 0.5rem;
  color: #888;
}

.hud-value {
  font-size: 0.8rem;
  color: var(--neon-yellow);
  text-shadow: 0 0 6px var(--neon-yellow);
}

/* Status */
.status {
  font-size: 0.5rem;
  color: var(--neon-green);
}

.status.error {
  color: #ff4444;
}

/* Game Over */
.final-score {
  font-size: 0.7rem;
  color: var(--neon-yellow);
  text-shadow: 0 0 10px var(--neon-yellow);
}
```

- [ ] **Step 2: Remove default Vite styles**

```bash
rm -f src/App.css
```

Remove any import of `App.css` from `App.tsx` if present.

- [ ] **Step 3: Clean up Vite boilerplate**

Remove `src/assets/` directory and any leftover Vite template files (like `public/vite.svg`) that aren't needed.

- [ ] **Step 4: Verify the full app renders**

```bash
npm run dev
```

Expected: Retro arcade themed page with "Sign Up / Login" button.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add retro arcade styling and clean up boilerplate"
```

---

### Task 13: Manual end-to-end test

- [ ] **Step 1: Set real environment variables**

Replace `.env` values with real API keys.

- [ ] **Step 2: Test connect flow**

1. Open http://localhost:5173
2. Click "Sign Up / Login"
3. Complete passkey flow in ReactUIHandler modal
4. Verify address displays on Setup screen

- [ ] **Step 3: Test permission grant**

1. Click "Get Started"
2. Approve the permission grant in the modal
3. Verify game screen appears with coin, balance, timer

- [ ] **Step 4: Test gameplay**

1. Click the coin
2. Verify "Sending transaction..." appears
3. Verify balance updates after confirmation
4. Verify click counter increments

- [ ] **Step 5: Test session expiry**

1. Wait for timer to expire (or temporarily reduce `SESSION_DURATION` to 60 seconds)
2. Verify Game Over screen appears
3. Click "New Session" → verify new permission grant flow works

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: finalize gaming demo"
```
