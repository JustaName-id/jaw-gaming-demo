# Arcade Coin Clicker

An interactive arcade game demo built on Base Sepolia where users click a coin to earn points. Each click costs 0.1 USDC and is submitted as a gasless blockchain transaction using account abstraction.

> **100% Agentic Coded** — This entire app was built by AI agents using Claude Code with the [jaw-sdk-best-practices](https://github.com/anthropics/claude-code-skills) skill, which provides guidance on JAW SDK patterns, APIs, and integration best practices.

## Features

- **Wallet Connection** — Connect via JAW smart accounts with ENS gamertag display
- **Gasless Transactions** — Clicks are submitted on-chain with no gas fees (Etherspot paymaster)
- **Timed Sessions** — 1-hour game sessions with a 2 USDC spend limit
- **Real-time UI** — Live click counter, remaining balance, countdown timer, and transaction tracking

## Tech Stack

- React 19, TypeScript, Vite
- wagmi + viem
- @jaw.id/core & @jaw.id/wagmi (account abstraction / smart accounts)
- @justaname.id/react (ENS resolution)
- Radix UI (components)

## Getting Started

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh)

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_JAW_API_KEY=<your-jaw-api-key>
VITE_ENS_DOMAIN=<your-ens-domain>
VITE_PAYMASTER_URL=<your-etherspot-paymaster-url>
```

### Install & Run

```bash
bun install
bun run dev
```

### Other Scripts

```bash
bun run build      # Production build
bun run preview    # Preview production build
bun run lint       # Run ESLint
```

## Game Rules

| Parameter        | Value          |
| ---------------- | -------------- |
| Cost per click   | 0.1 USDC       |
| Session duration | 1 hour         |
| Spend limit      | 2 USDC/session |
| Network          | Base Sepolia   |
