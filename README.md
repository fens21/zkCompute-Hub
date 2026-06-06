# zkCompute Hub

A decentralized verifiable compute marketplace built on the **LitForge Testnet** (LITVM — Litecoin zk-rollup). Users can post compute jobs (ML training, ZK proof generation, rendering, AI inference, etc.) and workers complete them by submitting cryptographic proofs — all managed on-chain.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8 |
| Blockchain | Solidity 0.8.20, Hardhat, Wagmi 3, Viem 2 |
| Wallet | RainbowKit 2 (MetaMask, Rabby, OKX, WalletConnect, Brave, etc.) |
| Backend | Supabase (job metadata, activity logs, profiles) |

## Features

- **Job Marketplace** — Browse, search, filter by type, sort by reward/deadline with grid/list toggle and pagination
- **Job Lifecycle** — Post, edit (title, type, description, requirements, deadline, difficulty), claim, submit proof (regular hash/file or **ZK solution proof**), release payment, deactivate
- **Job Metadata** — Title, type, description, requirements, deadlines, difficulty, token symbol persisted via Supabase
- **Dual Token** — Pay in native zkLTC or USDC
- **Dispute System** — Raise & resolve disputes on-chain
- **Leaderboard** — Worker rankings with podium, points, and gamified badges
- **Profile & Avatars** — Bio, skills, avatar upload via Supabase Storage
- **Stats Dashboard** — Earnings, escrow value, top/most claimed jobs with pagination
- **Notifications** — Toast system with type icons and navbar dropdown with relative timestamps
- **Carousel Banner** — Rotating showcase of latest jobs with dot navigation and dismiss
- **Live Countdowns** — Deadline timers with color-coded urgency (expired, < 1h, normal)
- **Mobile Responsive** — Adaptive layout, hamburger menu, touch-friendly targets, and mobile-optimized cards across all pages
- **Difficulty Levels** — Manual difficulty selector (Medium / Hard / Expert) when posting jobs
- **Meaningful ZK Proofs** — Workers prove knowledge of the correct `solution` for a job's `expectedOutput` (Poseidon(jobId, solution) === expectedOutput) without revealing the solution. Poster sets the target hash in Expected Output when choosing ZK verification.

## How ZK Verifiable Proofs Work (v2)

1. **Poster** creates a job and sets **Verification Method = ZK Proof** + puts the target value in **Expected Output**.
   - The target is typically `Poseidon(jobId, correctSolution)`.
   - You can compute it locally using `circomlibjs` or a small helper script.
2. **Worker** claims the job and performs the required compute / puzzle off-chain to discover the solution.
3. In "My Jobs", for ZK-type jobs the worker clicks **SUBMIT ZK PROOF** and enters their private `solution`.
4. The frontend uses snarkjs + the circuit to generate a Groth16 proof that they know the preimage.
5. On-chain `submitZKProof(...)` verifies it via the `RealVerifier` and **automatically releases** the reward if valid.

This replaces the previous "random secret" ZK that didn't actually prove any compute was performed.

**Note:** After changing the circuit you must recompile (`circom` + `snarkjs`) the wasm/zkey and call `npm run set-vk` (or redeploy verifier) with the new `verification_key_final.json` so the on-chain verifier accepts the new public signals.

## Prerequisites

- Node.js >= 18
- RainbowKit-compatible wallet (MetaMask, Rabby, OKX, WalletConnect, Brave, etc.)
- LitForge Testnet added to wallet (Chain ID: 4441)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```env
PRIVATE_KEY=your_deployer_private_key
VITE_CONTRACT_ADDRESS=0xaaf4555aad78b7981e4e619124a28fc137faffd8  # Fresh deployment (empty marketplace)
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

## Deploy Contract (Fresh Deployment)

To get a completely clean marketplace (no old jobs):

```bash
npm run deploy:all
```

This deploys:
- New `JobMarketplace`
- New `RealVerifier`
- Sets the verifier on the marketplace

Then copy the printed `VITE_CONTRACT_ADDRESS=...` into your `.env` and `src/config/chain.ts` (or Vercel env vars).

**Current live contract (fresh deployment - Marketplace, Posted Jobs & My Jobs start empty):**
`0xaaf4555aad78b7981e4e619124a28fc137faffd8`

**ZK is ready:** The circuit has been recompiled (`circom 2.1.9` + snarkjs) and the Verification Key has been set on the new `RealVerifier` for this deployment. ZK proof submission (with solution input) should work out of the box.

**Important for Vercel / production:**
If you have `VITE_CONTRACT_ADDRESS` set as an Environment Variable in your Vercel project dashboard, update it to the new address above and redeploy (or the code fallback will be used after this push).

After switching to a new contract:
- Marketplace, Posted Jobs will be empty (on-chain).
- For clean "My Jobs", clear browser localStorage (keys: `zkcompute_myjobs_v2`, `zkcompute_workers`, `zkcompute_synced_*`).

The recompile + `npm run set-vk` steps have been executed for this fresh deployment.

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
