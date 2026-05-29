# zkCompute Hub

A decentralized verifiable compute marketplace built on the **LitForge Testnet** (LITVM — Litecoin zk-rollup). Users can post compute jobs (ML training, ZK proof generation, rendering, AI inference, etc.) and workers complete them by submitting cryptographic proofs — all managed on-chain.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4 |
| Blockchain | Solidity 0.8.20, Hardhat, Wagmi 3, Viem 2 |
| Backend | Supabase (profiles, avatars, activity logs) |
| Data | CoinGecko API (LTC/USD price) |

## Features

- **Job Lifecycle** — Post, claim, submit proof, release payment, deactivate
- **Dual Token** — Pay in native zkLTC or USDC
- **Dispute System** — Raise & resolve disputes on-chain
- **Leaderboard** — Worker rankings with podium, points, and gamified badges
- **Profile & Avatars** — Bio, skills, avatar upload via Supabase Storage
- **Stats Dashboard** — Earnings, escrow value, top jobs
- **Live Pricing** — LTC/USD from CoinGecko

## Prerequisites

- Node.js >= 18
- MetaMask or Brave Wallet
- LitForge Testnet added to wallet (Chain ID: 4441)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```env
PRIVATE_KEY=your_deployer_private_key
VITE_CONTRACT_ADDRESS=0x...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Deploy Contract

```bash
npm run deploy:contract
```

## Network

| Property | Value |
|---|---|
| Chain | LitForge Testnet |
| Chain ID | 4441 |
| RPC | `https://liteforge.rpc.caldera.xyz/http` |
| Explorer | `https://liteforge.explorer.caldera.xyz/` |
| Native Token | zkLTC (18 decimals) |

## License

MIT — Copyright 2026, fens21
