# Gaming Demo — Arcade Coin Clicker

## Overview

A Vite React single-page app demonstrating JAW SDK's permission system. Users connect a smart account via passkey, grant a delegated session to a temporary access key, then play a coin-clicker game where each click spends 0.1 USDC through the access key.

## State Machine

```
disconnected → connected → permissioned → playing
                                ↑              ↓
                                └── expired/depleted
```

| State | UI | Trigger to next |
|---|---|---|
| Disconnected | "Sign Up / Login" button | User clicks, `wallet_connect` via wagmi connector |
| Connected | User address shown, "Get Started" button | User clicks, `useGrantPermissions` called |
| Permissioned/Playing | Arcade coin, balance display, click to spend | Coin click triggers `Account.sendCalls` |
| Expired/Depleted | "Game Over" + "New Session" button | User clicks, new access key generated, re-grant |

## Tech Stack

- Vite + React + TypeScript
- `@jaw.id/wagmi` — JAW wagmi connector
- `@jaw.id/core` — `Account.fromLocalAccount`, `Mode` enum
- `@jaw.id/ui` — `ReactUIHandler` for app-specific passkey UI
- `wagmi` + `@tanstack/react-query` — hooks, provider
- `viem` — ABI encoding, key generation, utilities

## Environment Variables

```
VITE_JAW_API_KEY=           # JAW dashboard API key
VITE_ENS_DOMAIN=            # ENS domain for subname issuance
VITE_ETHERSPOT_API_KEY=     # Etherspot paymaster API key
```

Paymaster URL constructed as: `https://rpc.etherspot.io/paymaster/?api-key=${VITE_ETHERSPOT_API_KEY}&useVp=true`

## Wagmi Configuration

- Chain: Base Sepolia (84532)
- `defaultChainId: 84532`
- Connector: `jaw()` with `Mode.AppSpecific`, `ReactUIHandler`, ENS domain, paymaster keyed by chain ID
- `showTestnets: true` (required for testnet chain IDs)
- Must define `transports` with `http()` for Base Sepolia (missing transports cause silent failures)
- `useConnect` and `useDisconnect` must be imported from `@jaw.id/wagmi`, NOT from `wagmi`

## Access Key Management

- On "Get Started" click (and on every "New Session"), generate a random private key using viem's `generatePrivateKey()`
- Store in `localStorage` under key `AccessKeys`
- Convert to a `LocalAccount` via `privateKeyToAccount(privateKey)` from `viem/accounts`
- Create account via `Account.fromLocalAccount(config, localAccount)` where config is:
  - `chainId: 84532` (Base Sepolia)
  - `apiKey: import.meta.env.VITE_JAW_API_KEY`
  - `paymasterUrl: https://rpc.etherspot.io/paymaster/?api-key=${VITE_ETHERSPOT_API_KEY}&useVp=true`
- The address from this account is used as the `spender` in `useGrantPermissions`

**Note:** The wagmi hooks operate on the user's smart account (connected via JAW connector), while `Account.fromLocalAccount` operates on a separate access key account. These are two different accounts, so using both wagmi hooks and the Account API is valid here.

## Permission Grant (ERC-7715)

Called via `useGrantPermissions` from `@jaw.id/wagmi`:

- **`spender`:** address of `Account.fromLocalAccount` (the access key)
- **`end`:** `Math.floor(Date.now() / 1000) + 3600` (1 hour from now, Unix seconds)
- **`permissions`:**
  - `calls`: contract `0x036CbD53842c5426634e7929541eC2318f3dCF7e`, function `transfer(address,uint256)`
  - `spends`: `[{ token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', allowance: parseUnits('2', 6).toString(), unit: 'hour' }]`

The returned `permissionId` is stored in React state for use during gameplay.

## Game Mechanics

- Display a retro arcade-style spinning/bouncing gold coin
- Each click calls `account.sendCalls` on the access key account with:
  - `permissionId` from the grant
  - A `transfer` call sending `parseUnits('0.1', 6)` USDC to a designated game treasury address (defined in `constants.ts`)
  - Paymaster handles gas
- `sendCalls` returns immediately with a user operation ID — must poll `account.getCallStatus(id)` until status is 200 (Completed)
  - Status codes: 100=Pending, 200=Completed, 400=Failed, 500=Reverted
- After status 200, refresh the user's USDC balance via `useReadContract`
- Disable coin during pending transactions to prevent double-clicks
- On status 400/500, re-enable coin and show error feedback

## Balance Display

- Read USDC balance of the user's smart account using wagmi `useReadContract` with `balanceOf`
- Display with decimals (e.g., "1.9 USDC")
- Refresh after each click confirms (status 200)

## Session Expiry / Depletion

- Track permission expiry time in state
- Show countdown timer
- When expired or balance is 0: show "Game Over" screen with "New Session" button
- "New Session" flow:
  1. Generate new private key, replace `AccessKeys` in localStorage
  2. Convert via `privateKeyToAccount`, create new `Account.fromLocalAccount` with full config
  3. Call `useGrantPermissions` again with new spender address and fresh `end` timestamp
  4. Return to playing state

## Error Handling

- **User rejects passkey prompt (4001):** Stay on current screen, show brief error message
- **User rejects permission grant (4001):** Stay on connected screen, allow retry
- **`sendCalls` fails (400/500):** Re-enable coin, show "Transaction failed" toast, allow retry
- **Permission expired mid-game:** Transition to Game Over screen

## File Structure

```
src/
  config/
    wagmi.ts          — wagmi config, JAW connector, chains
    constants.ts      — USDC address, ABI fragment, game treasury address, game settings
  hooks/
    useAccessKey.ts   — private key lifecycle, Account.fromLocalAccount
    useGame.ts        — click handler, sendCalls with permissionId, status polling, balance refresh
  components/
    ConnectScreen.tsx  — "Sign Up / Login" button
    SetupScreen.tsx    — shows address, "Get Started" button
    GameScreen.tsx     — arcade coin, balance, timer
    GameOverScreen.tsx — result + "New Session" button
    Coin.tsx           — the clickable animated coin
  App.tsx             — state machine, view switching
  main.tsx            — providers (WagmiProvider, QueryClientProvider)
  index.css           — retro arcade styles
.env                  — placeholder env vars
```

## Styling

Retro arcade theme:
- Dark background
- Pixel/retro font
- Gold animated coin (CSS animation — spin/bounce)
- Neon-style text for balance and timer
- Simple, no external CSS framework needed
