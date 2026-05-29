export interface Job {
  id: number
  title: string
  type: string
  reward: number
  deadline: string
  description: string
  requirements: string
  poster: string
  claimedCount: number
  maxWorkers: number
  difficulty: string
  status?: string
  escrow?: boolean
  tokenSymbol?: string
  claimedBy?: string
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'info'
}

export interface WorkerEvent {
  worker: string
  jobId: number
  title: string
  reward: number
  tokenSymbol: string
  status: 'claimed' | 'completed' | 'paid'
  time: number
}

export interface WorkerProfile {
  worker: string
  bio: string
  skills: string[]
  avatarUrl?: string
  updatedAt: number
}

export interface LeaderboardEntry {
  worker: string
  jobsClaimed: number
  jobsPaid: number
  totalEarned: number
  earnedZkltc: number
  earnedUsdc: number
  points: number
  bio?: string
  skills?: string[]
  avatarUrl?: string
}

export interface NewJobForm {
  title: string
  type: string
  reward: number
  deadline: string
  description: string
  requirements: string
  maxWorkers: number
  token: 'zkLTC' | 'USDC' | 'custom'
  customToken?: string
}

export interface ConfirmAction {
  type: 'unclaim' | 'submit' | 'deactivate' | 'dispute' | 'resolveCancel'
  job: Job | null
  disputeWorker?: string
  disputeReason?: string
}

export interface DisputeState {
  job: Job
  worker?: string
  reason: string
}

export type Tab = 'market' | 'post' | 'my' | 'stats' | 'leaderboard' | 'profile'
export type PostSubTab = 'new' | 'manage'
export type SortBy = 'reward' | 'deadline'
