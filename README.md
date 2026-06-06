# zkCompute Hub

**A decentralized, verifiable compute marketplace on LitVM (Litecoin Rollup / LitForge Testnet).**

Post heavy compute jobs — ML training & inference, ZK proofs, 3D rendering, scientific simulations, data labeling, audio/image generation, smart contract audits, RAG, FHE, and more. Workers claim jobs, execute off-chain, and submit cryptographic proofs (real Groth16 ZK or hash-based). Funds are escrowed on-chain and released automatically only after successful on-chain verification. No trust between parties required.

## How It Works (High Level)

1. **Poster** creates a job and escrows the total reward (`reward × maxWorkers`). Optionally pays a visibility booster fee.
2. **Worker** finds the job (boosted jobs rank higher) and claims it.
3. Worker performs the actual heavy compute / puzzle / generation **off-chain**.
4. Worker submits a proof:
   - Regular (hash + optional file/artifact), **or**
   - Real ZK Groth16 proof (enters private `solution` → frontend + snarkjs generates the proof on the fly).
5. The smart contract verifies the proof on-chain via the `RealVerifier`.
6. On success the escrowed payment is released automatically to the worker.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8 |
| Blockchain | Solidity 0.8.20, Hardhat, Wagmi 3, Viem 2 |
| Wallet | RainbowKit 2 (MetaMask, Rabby, OKX, WalletConnect, Brave, etc.) |
| Backend | Supabase (job metadata, activity logs, profiles) |

## Key Features

- **Full Dashboard** — Personalized overview with quick stats (earnings, completed jobs, active claims, posted active, reputation + rank), active claims & posted jobs, recent activity, recommended jobs (type-matched), earnings trend chart, reputation progress bar, pending actions, and financial snapshot (escrowed + boost fees).

- **Job Booster (Platform Fee)** — Posters can boost any of their active jobs by paying **25% of the job's total reward** (`reward × maxWorkers`) as a **one-time platform fee sent to the developer**. The job then receives priority visibility and ranking in the Marketplace + "Recommended for You" for 7 days. **This fee does NOT increase the reward paid to workers** — it is purely a visibility/promotion cost.

- **Marketplace** — Browse, search, filter by job type (ML, ZK, Render, AI, Scientific, FHE, etc.), sort, grid/list, pagination, live countdowns.

- **Post & Manage Jobs** — Rich type-specific forms, edit posted jobs, deactivate, release payments, handle disputes.

- **My Jobs** — Workers: claim + submit real ZK proofs (Poseidon solution proof) or hash proofs. Posters: monitor & manage.

- **Real ZK Verifiable Compute** — Groth16 proofs via snarkjs/circom. Workers prove knowledge of private solution without revealing it.

- **Dual Token** — Escrow in native zkLTC or USDC.

- **Reputation & Leaderboard** — On-chain snapshots, points, podium, badges.

- **Dispute System** — Full on-chain raise/resolve.

- **Modern UI/UX** — Responsive, smooth animations (fade-ins, hovers), dark theme with gold accents (#F7CE3E), improved contrast, good empty states.

- **Live on Testnet** — Fully functional on LitVM LiteForge Testnet (Chain ID 4441).

## Real ZK Verifiable Compute

For jobs marked with ZK verification, the poster sets an `expectedOutput` (typically the Poseidon hash of the correct secret solution for that `jobId`).

The worker who claims the job figures out the private solution off-chain, then in **My Jobs** clicks "Submit ZK Proof", enters their `solution`, and the frontend uses the pre-generated circuit + snarkjs to create a Groth16 proof.

The contract calls `submitZKProof(...)` which verifies via the on-chain `RealVerifier`. If valid, payment is released instantly.

The circuit was recompiled with circom 2.1.9 + snarkjs and the verification key has been set on the current `RealVerifier` for this deployment.

## Getting Started (Testnet)

1. Add LitVM LiteForge Testnet to your wallet:
   - Chain ID: **4441**
   - RPC: `https://liteforge.rpc.caldera.xyz/http`
   - Currency: zkLTC
   - Explorer: https://liteforge.explorer.caldera.xyz

2. Get test zkLTC from the faucet (Caldera hub / LitVM faucet).

3. Install & run:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173 and connect your wallet.

## Environment Variables

```env
VITE_CONTRACT_ADDRESS=0xaaf4555aad78b7981e4e619124a28fc137faffd8
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

(For local contract work you also need a `PRIVATE_KEY` in a `.env` for Hardhat.)

## Common Scripts

```bash
npm run dev          # Start dev server
npm run build        # Type check + production build
npm run deploy:all   # Deploy fresh Marketplace + RealVerifier (updates chain.ts)
npm run set-vk       # Push new verification key after circuit changes
```

## Fresh Contract Deployment

To reset the entire marketplace (start completely empty):

```bash
npm run deploy:all
```

This deploys a new `JobMarketplace` + new `RealVerifier` and updates `src/config/chain.ts`.

Copy the new address into:
- `.env` (local)
- Vercel environment variables (for production)
- Then redeploy the frontend.

**Current live contract** (fresh empty deployment):
`0xaaf4555aad78b7981e4e619124a28fc137faffd8`

After switching contracts you will need to clear some localStorage keys in the browser for a clean "My Jobs" view (`zkcompute_myjobs_v2`, `zkcompute_workers`, etc.).

The ZK circuit is already recompiled and the VK is set for the current verifier.

## Network

| Property      | Value                                           |
|---------------|-------------------------------------------------|
| Chain         | LitVM LiteForge Testnet                         |
| Chain ID      | 4441                                            |
| Native Token  | zkLTC (18 decimals, 1:1 backed by LTC)          |
| RPC (HTTP)    | https://liteforge.rpc.caldera.xyz/http          |
| Explorer      | https://liteforge.explorer.caldera.xyz          |

## Links

- GitHub: https://github.com/fens21/zkCompute-Hub
- Live Frontend: https://www.zkcomputhub.io (or https://zkcompute-fspnn1icc-fens21s-projects.vercel.app)
- Explorer: https://liteforge.explorer.caldera.xyz
- LitVM / Caldera: https://docs.litvm.com or Caldera hub

## Project Notes

- The UI was recently audited and lightened (removed heavy animations, standardized cards, new color system `#C5C1C0 / #0A1612 / #1A2930 / #F7CE3E`).
- Landing page now features a subtle animated starfield background, improved copy, pruned CTAs (only "Get Started" + Connect Wallet), and better contrast.
- New extensible job types were added (Audio Processing, Image/Video Generation, Smart Contract Audit, Data Anonymization, LLM Evaluation, etc.).
- Dashboard implements exactly the requested panels + the real 25% developer-fee booster.

## License

MIT — Copyright 2026, fens21

---

**Testnet only.** Use with test funds. Not financial advice. Built for verifiable, trust-minimized compute on Bitcoin-aligned infrastructure (LitVM).
