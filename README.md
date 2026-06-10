# zkCompute Hub

> **Decentralized, Verifiable Compute Marketplace** — built on LitVM (Litecoin Rollup / LitForge Testnet).

Post compute jobs (ML training, ZK proofs, 3D rendering, AI inference, data labeling, scientific simulation, and more). Workers claim jobs, execute off-chain, and submit cryptographic proofs. Funds are escrowed on-chain and released automatically upon verification — no trust required.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Zero-Knowledge Proof System](#zero-knowledge-proof-system)
- [Subgraph / GraphQL API](#subgraph--graphql-api)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Supported Job Types](#supported-job-types)
- [License](#license)

---

## Features

### Core Marketplace
- **Post Jobs** — Create compute jobs with type-specific dynamic forms, parameter fields, reward in zkLTC or USDC, and deadlines.
- **Claim Jobs** — Workers browse and claim available job slots.
- **Submit Proofs** — Workers submit Groth16 ZK proofs or hash-based proofs to prove correct execution.
- **Automatic Escrow** — Rewards are escrowed in the smart contract upon posting and released automatically upon successful verification.
- **Dispute Resolution** — On-chain dispute system for conflict resolution between posters and workers.
- **Manage Jobs** — Edit, deactivate, release payments, and handle disputes for posted jobs.

### Verification Methods

| Method | Description |
|---|---|
| **ZK Proof (Groth16)** | Workers prove knowledge of a private solution without revealing it. Uses snarkjs + Circom circuit with Poseidon hashing. |
| **Hash Check** | Off-chain SHA-256 based hash verification with optional file upload to Supabase Storage. |

### User Experience
- **Dashboard** — Real-time stats: earnings, completed jobs, active claims, posted jobs, reputation rank, earnings trend chart, pending actions, and financial snapshot.
- **Marketplace** — Browse jobs with searchable type filter, sort by reward or deadline, grid/list views, pagination, and live countdown timers.
- **My Jobs** — Track claimed jobs, submit proofs, and monitor status.
- **Leaderboard** — On-chain reputation snapshots, points system, podium display, and worker badges.
- **Real-Time Chat** — In-app messaging between posters and workers per job via Supabase Realtime with unread badges, notifications, and typing indicators.
- **Profile & Worker Profiles** — Editable profiles with avatars, reputation display, and detailed worker cards.

### Token Support
- **zkLTC** — Native token of LitForge Testnet.
- **USDC** — ERC-20 token at `0xd5118dEe968d1533B2A57aB66C266010AD8957fa`.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 6, Vite 8, React Router 7 |
| **Styling** | Tailwind CSS 4, CSS custom properties, mobile-responsive design |
| **Blockchain** | Solidity 0.8.20, Hardhat 2, Wagmi 3, Viem 2 |
| **Wallet** | ConnectKit (MetaMask, Rabby, OKX, WalletConnect, Brave, etc.) |
| **Backend / Storage** | Supabase (PostgreSQL: job_metadata, profiles, activities, chat; Storage: proofs, avatars, attachments) |
| **Real-Time** | Supabase Realtime (chat, presence, typing indicators) |
| **ZK Proofs** | Circom 2, snarkjs 0.7, circomlibjs, Groth16 on BN254 |
| **State Management** | Zustand, React hooks, localStorage |
| **Data Indexing** | The Graph (subgraph) — AssemblyScript, Graph CLI |
| **Linting** | ESLint 10 with typescript-eslint |
| **Deployment** | Vercel (frontend), Hardhat/Viem scripts (contracts) |

---

## Architecture

```
                    ┌─────────────────────────────────────────────────┐
                    │              Frontend (React + Vite)            │
                    │  ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
                    │  │Dashboard │ │Marketplace│ │   My Jobs    │  │
                    │  ├──────────┤ ├───────────┤ ├──────────────┤  │
                    │  │ PostJob  │ │Leaderboard│ │  Chat (RT)   │  │
                    │  └──────────┘ └───────────┘ └──────────────┘  │
                    └───────────────────┬─────────────────────────────┘
                                        │
                    ┌───────────────────▼─────────────────────────────┐
                    │         Wagmi / Viem / ConnectKit              │
                    │               (Wallet Layer)                    │
                    └───────────────────┬─────────────────────────────┘
                                        │
          ┌─────────────────────────────▼──────────────────────────────┐
          │                       On-Chain                             │
          │  ┌──────────────────────────────────────────────────────┐  │
          │  │              JobMarketplace.sol                      │  │
          │  │  • Post/Claim/Submit/Release/Dispute                 │  │
          │  │  • Dual token escrow (zkLTC & USDC)                  │  │
          │  │  • On-chain reputation snapshots                     │  │
          │  └──────────────────────┬───────────────────────────────┘  │
          │  ┌──────────────────────▼───────────────────────────────┐  │
          │  │              RealVerifier.sol                        │  │
          │  │  • Groth16 pairing check (BN254)                     │  │
          │  │  • Precompile-based verification (ecadd, ecmul,      │  │
          │  │    ecpairing at addresses 6, 7, 8)                   │  │
          │  └──────────────────────────────────────────────────────┘  │
          │               LitForge Testnet (Chain ID: 4441)            │
          └──┬─────────────────────────────────────────────────────────┘
             │
          ┌──▼──────────────────────────────┐  ┌──────────────────────────┐
          │    The Graph Subgraph            │  │    Supabase              │
          │  (indexes on-chain events)       │  │  • job_metadata         │
          │  • Workers, Jobs, Claims         │  │  • profiles             │
          │  • Payments, Proofs, Disputes    │  │  • activities           │
          └──────────────────────────────────┘  │  • chat / messages      │
                                                │  • Storage buckets      │
                                                └──────────────────────────┘
```

### Data Flow

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

## Smart Contracts

### `contracts/JobMarketplace.sol`

The core marketplace contract deployed on LitForge Testnet.

**Key Data Structures:**
- `Job` — id, title, jobType, reward, token (address(0) = zkLTC / USDC address), poster, maxWorkers, claimedCount, active, deadline
- `ReputationSnapshot` — jobsClaimed, jobsPaid, totalEarned, reputationHash

**Key Functions:**
| Function | Description |
|---|---|
| `postJobNative()` | Post a job paying in native zkLTC (excess msg.value refunded) |
| `postJobUSDC()` | Post a job paying in USDC via `transferFrom` |
| `claimJob(uint256 jobId)` | Worker claims an available job slot |
| `submitProof(uint256 jobId, string calldata proof)` | Submit hash-based proof |
| `submitZKProof(...)` | Submit Groth16 proof (a, b, c, input) — auto verifies and pays |
| `releasePayment(uint256 jobId, address worker)` | Poster manually releases payment |
| `deactivateJob(uint256 jobId)` | Cancel a job before any claims |
| `raiseDispute(uint256 jobId, address worker, string calldata reason)` | Initiate a dispute |
| `resolveDispute(uint256 jobId, address worker, bool acceptCancellation)` | Resolve a dispute |
| `releaseUnproven(uint256 jobId, address worker)` | Reclaim funds after deadline if no proof submitted |
| `setVerifier(address _verifier)` | Owner sets/updates the ZK verifier contract |

**Security:** Reentrancy guard (`nonReentrant`), proof replay protection, deadline enforcement, excess refunds for native token jobs.

### `contracts/RealVerifier.sol`

Groth16 verifier for BN254 curve (alt_bn128). Uses EVM precompiles:
- `ecadd` (address `0x06`) — elliptic curve point addition
- `ecmul` (address `0x07`) — elliptic curve scalar multiplication
- `ecpairing` (address `0x08`) — elliptic curve pairing check

Verifies a proof via 4 pairings: `[-a]b * [alpha1]beta2 * [acc]gamma2 * [c]delta2 = 1`.

### `contracts/IVerifier.sol`

Standard Groth16 verifier interface.

### Deployed Addresses (LitForge Testnet)

| Contract | Address |
|---|---|
| JobMarketplace | `0xaaf4555aad78b7981e4e619124a28fc137faffd8` |
| RealVerifier | `0xb98591e4c9dfd70070f2348623c803266c882e73` |
| USDC | `0xd5118dEe968d1533B2A57aB66C266010AD8957fa` |

---

## Zero-Knowledge Proof System

### Circuit: `zk/circuits/job_proof.circom`

Proves knowledge of a secret `solution` such that `Poseidon(jobId, solution) === expectedOutput`.

- **Public inputs:** `jobId`, `expectedOutput`
- **Private input:** `solution`
- **Hash:** Poseidon (2 inputs) from circomlib
- **Constraint:** `expectedOutput === poseidon.out`

### Proving System

- **Scheme:** Groth16 on BN254 curve
- **Proving key:** `public/zk/job_proof_final.zkey`
- **WASM witness:** `public/zk/job_proof.wasm`
- **Powers of Tau:** Phase 1 ceremony files included

### Proof Generation

The frontend (`src/utils/zkProof.ts`) uses snarkjs:

```typescript
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  { jobId, expectedOutput, solution },
  '/zk/job_proof.wasm',
  '/zk/job_proof_final.zkey',
)
```

Returns formatted Groth16 proof `{ a, b, c, input }` ready for on-chain submission.

### ZK Workflow

1. **Poster** posts a job with `expectedOutput = Poseidon(jobId, correctSolution)`.
2. **Worker** claims the job, executes compute off-chain, discovers `solution`.
3. Worker enters the solution in the frontend.
4. Frontend generates a Groth16 proof via snarkjs.
5. Proof is submitted via `submitZKProof()` on the contract.
6. `RealVerifier.verifyProof()` validates the proof via BN254 pairing check.
7. On success, payment is automatically released to the worker.

### Utility Scripts

| Script | Description |
|---|---|
| `scripts/poseidon-hash.mjs` | Compute `Poseidon(jobId, solution)` for testing |
| `scripts/generate-proof.cjs` | Full proof generation + export Solidity calldata |
| `scripts/test-proof.cjs` | Generate proof, verify locally, then verify on-chain |
| `cli/generate-proof.js` | CLI tool for hash-based proof generation |

---

## Subgraph / GraphQL API

The subgraph (`subgraph/`) indexes on-chain events from `JobMarketplace` for efficient querying.

**Network:** LitForge — Start Block: `15,184,000`

**Indexed Entities:**

| Entity | Fields |
|---|---|
| `Worker` | address, jobsClaimed, jobsPaid, totalEarned, reputationHash, lastUpdated |
| `Job` | poster, reward, token, active |
| `Claim` | job, worker, timestamp |
| `Payment` | job, worker, amount, timestamp |
| `ProofSubmission` | job, worker, proofHash, timestamp |
| `Dispute` | job, worker, initiator, reason, resolved, acceptedCancellation, timestamp |

**Setup:**
```bash
cd subgraph
npm install
npm run codegen   # Generate AssemblyScript types
npm run build     # Build the subgraph
npm run deploy    # Deploy to The Graph
```

---

## Project Structure

```
├── src/                          # Frontend source
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root component
│   ├── abi/                      # Contract ABIs
│   ├── components/               # React components
│   │   ├── ChatPage.tsx          # Chat inbox
│   │   ├── ChatRoom.tsx          # Real-time chat room
│   │   ├── Dashboard.tsx         # User dashboard
│   │   ├── LandingPage.tsx       # Landing / disconnected state
│   │   ├── Leaderboard.tsx       # Reputation leaderboard
│   │   ├── Marketplace.tsx       # Browse available jobs
│   │   ├── Modals.tsx            # All modals (Proof, Confirm, Dispute, etc.)
│   │   ├── MyJobs.tsx            # Worker's claimed jobs
│   │   ├── Navbar.tsx            # Navigation
│   │   ├── PostJob.tsx           # Post & manage jobs
│   │   ├── Profile.tsx           # User profile
│   │   ├── SearchableSelect.tsx  # Reusable searchable dropdown
│   │   ├── Stats.tsx             # Statistics view
│   │   ├── ToastContainer.tsx    # Toast notifications
│   │   └── WorkerProfileModal.tsx# Worker profile popup
│   ├── config/chain.ts           # Wagmi config, chain definition
│   ├── constants/jobTypes.ts     # Job type definitions
│   ├── hooks/                    # Custom React hooks
│   │   ├── useChat.ts            # Supabase realtime chat
│   │   ├── useJobs.ts            # On-chain + metadata job fetching
│   │   ├── useMyJobs.ts          # Claimed jobs management
│   │   ├── useLeaderboard.ts     # Leaderboard aggregation
│   │   ├── useReputation.ts      # On-chain reputation
│   │   ├── useWorkerProfiles.ts  # Worker profile management
│   │   ├── usePrices.ts          # LTC price from CoinGecko
│   │   └── ...                   # Additional hooks
│   ├── lib/supabase.ts           # Supabase client
│   ├── store/chatStore.ts        # Zustand unread count store
│   ├── styles/                   # Design tokens & CSS
│   ├── types/                    # TypeScript interfaces
│   └── utils/
│       ├── utils.ts              # Utility helpers
│       └── zkProof.ts            # ZK proof generation
│
├── contracts/                    # Solidity smart contracts
│   ├── JobMarketplace.sol        # Core marketplace
│   ├── RealVerifier.sol          # Groth16 verifier
│   └── IVerifier.sol             # Verifier interface
│
├── subgraph/                     # The Graph subgraph
│   ├── schema.graphql            # GraphQL schema
│   ├── subgraph.yaml             # Manifest
│   └── src/mapping.ts            # Event handlers
│
├── zk/                           # Zero-knowledge proof system
│   ├── circuits/job_proof.circom # ZK circuit
│   ├── circomlib/                # Circom libraries (Poseidon)
│   └── build/                    # Compiled artifacts
│
├── public/zk/                    # Public ZK artifacts (served by Vite)
│   ├── job_proof_final.zkey      # Proving key
│   ├── job_proof.wasm            # WASM witness generator
│   └── sample-proof.json         # Sample proof
│
├── server/                       # Express backend
│   └── index.js                  # Proof file upload API
│
├── scripts/                      # Deployment & utility scripts
│   ├── deploy.cjs                # Hardhat deployment
│   ├── deploy-all-viem.cjs       # Full deployment via Viem
│   ├── deploy-verifier-viem.cjs  # Verifier deployment
│   ├── set-vk.cjs                # Set verification key on RealVerifier
│   ├── generate-proof.cjs        # Test ZK proof generation
│   ├── test-proof.cjs            # End-to-end proof test
│   ├── poseidon-hash.mjs         # Poseidon hash computation
│   └── ...
│
├── cli/generate-proof.js         # CLI hash proof generator
├── hardhat.config.cjs            # Hardhat configuration
├── vite.config.ts                # Vite configuration
├── vercel.json                   # Vercel deployment config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies & scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm**
- **Wallet** (MetaMask, Rabby, or any WalletConnect-compatible wallet)
- **Test zkLTC** from the LitVM faucet

### Step 1: Add LitForge Testnet to Your Wallet

| Property | Value |
|---|---|
| Chain Name | LitVM LiteForge Testnet |
| Chain ID | 4441 |
| RPC URL | `https://liteforge.rpc.caldera.xyz/http` |
| Native Token | zkLTC |
| Explorer | `https://liteforge.explorer.caldera.xyz` |

### Step 2: Get Test Tokens

Request test zkLTC from the [LitVM faucet](https://liteforge.faucet.caldera.xyz/).

### Step 3: Clone & Install

```bash
git clone <repository-url>
cd Job marketplace
npm install
```

> **Note:** This project uses `legacy-peer-deps=true` (configured in `.npmrc`).

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables)).

### Step 5: Run the Development Server

```bash
npm run dev
```

Open `http://localhost:5173` and connect your wallet.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PRIVATE_KEY` | Contract deployment | Wallet private key (prefix with `0x`) |
| `VITE_CONTRACT_ADDRESS` | Frontend | Deployed JobMarketplace contract address |
| `REAL_VERIFIER_ADDRESS` | Frontend / Scripts | Deployed RealVerifier contract address |
| `VITE_SUPABASE_URL` | Frontend / Server | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend / Server | Supabase anonymous API key |
| `VITE_SUBGRAPH_URL` | Optional | The Graph subgraph endpoint |
| `CORS_ORIGIN` | Server (optional) | Allowed CORS origin (default: `http://localhost:5173`) |
| `PORT` | Server (optional) | Express server port (default: `3001`) |

> ⚠️ **Security:** Variables prefixed with `VITE_` are exposed to the frontend. Never expose your `PRIVATE_KEY` to the client.

### Supabase Setup

The app requires the following Supabase resources:

1. **Tables:** `job_metadata`, `profiles`, `activities`, `chat_rooms`, `messages`
2. **Storage Buckets:** `proofs` (proof uploads), `avatars` (profile pictures), `chat-attachments` (file sharing)
3. **Row Level Security (RLS):** Enable on `job_metadata`, `profiles`, `activities`:

```sql
ALTER TABLE job_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
```

Create policies allowing anonymous reads and authenticated inserts/updates.

4. **Supabase Realtime:** Enable replication on `messages` and `chat_rooms` tables for real-time chat.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server at `localhost:5173` |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint across the codebase |
| `npm run preview` | Preview production build locally |
| `npm run deploy:contract` | Deploy contracts via Hardhat to LitForge |
| `npm run deploy:verifier` | Deploy only RealVerifier via Viem script |
| `npm run deploy:all` | Full deployment (marketplace + verifier + setVerifier) |
| `npm run set-vk` | Push verification key to RealVerifier after circuit changes |
| `npm run redeploy:verifier` | Redeploy verifier with new verification key |

### Server

```bash
cd server
npm install
npm start        # Starts on port 3001
```

### CLI

```bash
node cli/generate-proof.js <input>
node cli/generate-proof.js @file.txt     # Read from file
node cli/generate-proof.js "my data"     # Hash string
```

---

## Deployment

### Frontend (Vercel)

The project includes `vercel.json` with SPA rewrites and cache headers. Deploy via:

```bash
npx vercel --prod
```

### Smart Contracts (LitForge Testnet)

Full deployment flow:

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Deploy all (marketplace + verifier)
npm run deploy:all

# 3. If circuit changed, push new verification key
npm run set-vk

# 4. Update .env with new contract addresses
```

**Network Details:**
- **RPC:** `https://liteforge.rpc.caldera.xyz/http`
- **Chain ID:** `4441`
- **Explorer:** `https://liteforge.explorer.caldera.xyz`

---

## Supported Job Types

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
| Audio Processing | Transcription, generation, enhancement |
| Image Generation | Stable Diffusion, DALL-E, Midjourney |
| Smart Contract Audit | Security analysis, formal verification |
| Data Anonymization | PII redaction, differential privacy |
| LLM Evaluation | Benchmarking, red-teaming, alignment |
| Custom | User-defined compute tasks |

---

## License

MIT — Copyright 2026, fens21.

---

*Built for verifiable, trust-minimized compute on Bitcoin-aligned infrastructure (LitVM). Testnet only — use with test funds.*
