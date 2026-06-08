# zkCompute Hub

A decentralized, verifiable compute marketplace on LitVM (Litecoin Rollup / LitForge Testnet).

Post compute jobs — ML training & inference, ZK proofs, 3D rendering, scientific simulations, data labeling, audio/image generation, smart contract audits, RAG pipelines, FHE computation, and more. Workers claim jobs, execute off-chain, and submit cryptographic proofs (Groth16 ZK or hash-based). Funds are escrowed on-chain and released automatically upon successful verification. No trust required between parties.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8 |
| Blockchain | Solidity 0.8.20, Hardhat, Wagmi 3, Viem 2 |
| Wallet | RainbowKit 2 (MetaMask, Rabby, OKX, WalletConnect, Brave, etc.) |
| Backend | Supabase (job metadata, activity logs, profiles) |

---

## Features

- **Dashboard** — Personalized overview with real-time stats: earnings, completed jobs, active claims, posted jobs, reputation rank, earnings trend chart, pending actions, and financial snapshot.

- **Marketplace** — Browse available jobs with searchable type filter, sort by reward or deadline, grid/list view, pagination, and live countdown timers.

- **Post & Manage Jobs** — Type-specific dynamic forms with searchable parameter fields. Edit, deactivate, release payments, and handle disputes for your posted jobs.

- **My Jobs** — Claim available jobs, submit ZK proofs (Groth16 via snarkjs/circom) or hash proofs, and track job status.

- **Verifiable Compute** — Two verification methods:
  - **ZK Proof** — Groth16 proofs via snarkjs. Workers prove knowledge of a private solution without revealing it.
  - **Hash Check** — Off-chain hash verification with optional file upload.

- **Dual Token Escrow** — Pay rewards in native zkLTC or USDC.

- **Reputation & Leaderboard** — On-chain reputation snapshots, points system, podium display, and worker badges.

- **Dispute System** — On-chain dispute resolution between posters and workers.

- **Real ZK Verifiable Compute** — For jobs requiring ZK verification, the poster specifies a target Poseidon hash. Workers submit a private solution, and the frontend generates a Groth16 proof using a pre-compiled circuit. The contract verifies it via the on-chain `RealVerifier` and releases payment instantly on success.

---

## Getting Started (Testnet)

1. Add LitVM LiteForge Testnet to your wallet:

   | Property | Value |
   |---|---|
   | Chain Name | LitVM LiteForge Testnet |
   | Chain ID | 4441 |
   | RPC URL | `https://liteforge.rpc.caldera.xyz/http` |
   | Native Token | zkLTC |
   | Explorer | `https://liteforge.explorer.caldera.xyz` |

2. Get test zkLTC from the LitVM faucet.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open `http://localhost:5173` and connect your wallet.

---

## Environment Variables

```env
VITE_CONTRACT_ADDRESS=0xaaf4555aad78b7981e4e619124a28fc137faffd8
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For local contract development, also add a `PRIVATE_KEY` to `.env` for Hardhat.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type check + production build |
| `npm run deploy:all` | Deploy fresh Marketplace + RealVerifier contracts |
| `npm run set-vk` | Push new verification key after circuit changes |

---

## Job Types

| Type | Description |
|---|---|
| Machine Learning | Model training, fine-tuning, evaluation |
| Zero Knowledge Proof | Groth16, PLONK, STARK, and other proving systems |
| Video / 3D Render | Blender, Maya, Unreal Engine rendering |
| AI Inference | LLM deployment, batch inference, model serving |
| AI Training | Full fine-tune, LoRA, QLoRA, pre-training |
| Data Labeling | Classification, bounding box, segmentation, NER |
| Video Transcoding | H.264, H.265, VP9, AV1 encoding |
| Scientific Simulation | GROMACS, NAMD, LAMMPS, VASP, AlphaFold |
| RAG Pipeline | Document indexing, embedding, retrieval |
| FHE Computation | Fully homomorphic encryption workloads |
| Custom | User-defined compute tasks |

---

## Architecture

```
Poster                    Marketplace Contract            Worker
  │                              │                          │
  ├─ Post job + escrow ─────────>│                          │
  │                              │  ─── Job available ────> │
  │                              │  <── Claim job ───────── │
  │                              │                          ├─ Execute off-chain
  │                              │                          ├─ Generate proof
  │                              │  <── Submit proof ────── │
  │                              │                          │
  │                              ├─ Verify proof on-chain   │
  │                              ├─ Release payment ──────> │
  │                              │                          │
  │  <── Job completed ─────────│                          │
```

---

## Project Structure

```
src/
├── abi/              # Contract ABIs
├── components/       # React components
│   ├── Dashboard.tsx
│   ├── Marketplace.tsx
│   ├── PostJob.tsx
│   ├── MyJobs.tsx
│   ├── Modals.tsx
│   ├── Navbar.tsx
│   ├── SearchableSelect.tsx
│   └── ...
├── config/           # Chain configuration
├── constants/        # Job type definitions
├── hooks/            # Custom React hooks
├── styles/           # Design tokens
├── types/            # TypeScript interfaces
└── utils/            # Utility functions

contracts/            # Solidity smart contracts
subgraph/             # The Graph subgraph
server/               # Supabase integration
```

---

## License

MIT — Copyright 2026, fens21.

---

*Testnet only. Use with test funds. Built for verifiable, trust-minimized compute on Bitcoin-aligned infrastructure (LitVM).*
