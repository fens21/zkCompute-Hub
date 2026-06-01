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
  createdAt?: number
}

export interface Notification {
  id: number
  message: string
  time: number
  read: boolean
  type: 'claim' | 'proof' | 'payment' | 'dispute' | 'post' | 'chat'
  jobTitle?: string
}

export interface Message {
  id: number
  job_id: number
  sender: string
  recipient: string
  content: string
  created_at: number
  read: boolean
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'info' | 'error'
}

export interface WorkerEvent {
  worker: string
  jobId: number
  title: string
  reward: number
  tokenSymbol: string
  status: 'claimed' | 'completed' | 'paid'
  time: number
  proofUrl?: string
  job?: Job
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
  difficulty: string
}

export interface ConfirmAction {
  type: 'unclaim' | 'submit' | 'deactivate' | 'dispute' | 'resolveCancel'
  job: Job | null
  disputeWorker?: string
  disputeReason?: string
  claimantCount?: number
}

export interface DisputeState {
  job: Job | null
  worker?: string
  reason: string
}

export type Tab = 'market' | 'post' | 'my' | 'stats' | 'leaderboard' | 'profile'
export type PostSubTab = 'new' | 'manage'
export type SortBy = 'reward' | 'deadline'
