import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useAccount, useWriteContract, useSwitchChain, useChainId } from 'wagmi'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { readContract, waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits } from 'viem'
import abi from './abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS, USDC_ADDRESS } from './config/chain'
import { useToasts } from './hooks/useToasts'
import { useJobs } from './hooks/useJobs'
import { useMyJobs, saveWorkerEvent } from './hooks/useMyJobs'
import { useLeaderboard } from './hooks/useLeaderboard'
import { usePrices } from './hooks/usePrices'
import { useEarningsHistory } from './hooks/useEarningsHistory'
import { useActivityStreak } from './hooks/useActivityStreak'
import { LandingPage } from './components/LandingPage'
import { Navbar } from './components/Navbar'

// Lazy load heavy route components to improve tab switch performance
// Using .then() because components use named exports (not default)
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })))
const Marketplace = lazy(() => import('./components/Marketplace').then(m => ({ default: m.Marketplace })))
const PostJob = lazy(() => import('./components/PostJob').then(m => ({ default: m.PostJob })))
const MyJobs = lazy(() => import('./components/MyJobs').then(m => ({ default: m.MyJobs })))
const Stats = lazy(() => import('./components/Stats').then(m => ({ default: m.Stats })))
const Leaderboard = lazy(() => import('./components/Leaderboard').then(m => ({ default: m.Leaderboard })))
const Profile = lazy(() => import('./components/Profile').then(m => ({ default: m.Profile })))
import { colors } from './styles/tokens'
import { ToastContainer } from './components/ToastContainer'
import { JobDetailModal, ProofModal, ConfirmModal, EditProfileModal, DisputeModal, ZKSolutionModal } from './components/Modals'
import { WorkerProfileModal } from './components/WorkerProfileModal'
import type { Job, NewJobForm, ConfirmAction, DisputeState, Tab, PostSubTab, SortBy, LeaderboardEntry, WorkerEvent, Notification } from './types'
import { saveProfile, loadProfiles, uploadProofFile } from './hooks/useWorkerProfiles'
import { saveJobMetadata } from './hooks/useJobMetadata'
import { handleTxError, getDeadlineMs } from './utils'
import { generateZKProof } from './utils/zkProof'
import { useIsMobile } from './hooks/useIsMobile'

const USDC_DECIMALS = 6
const ERC20_ABI = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const

// Lightweight skeleton shown during lazy chunk load or initial data — much better than plain "Loading..."
function PageSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ padding: isMobile ? 8 : 20, opacity: 0.7 }}>
      <div style={{ height: 28, background: '#1A2930', borderRadius: 6, width: 220, margin: '0 auto 24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: isMobile ? 10 : 16 }}>
        {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
          <div key={i} style={{ background: '#1A2930', border: '1px solid #1A2930', borderRadius: 12, padding: isMobile ? 12 : 18, height: isMobile ? 140 : 200 }}>
            <div className="skeleton" style={{ height: 18, width: '35%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 22, width: '40%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

const queryClient = new QueryClient()
let notifIdCounter = 0
let refreshTimer: ReturnType<typeof setTimeout> | null = null
function scheduleRefresh(fn: () => void, delayMs = 2000) {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => { refreshTimer = null; fn() }, delayMs)
}

function AppContent() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const { toasts, showToast } = useToasts()
  const { jobs, setJobs, onChainJobs, loading: jobsLoading, error: jobsError, refetch: refetchJobs } = useJobs(true)
  const { myJobs, setMyJobs } = useMyJobs(address, true)
  const { leaderboard, loading: leaderboardLoading, fetchLeaderboard } = useLeaderboard()
  const { ltcPrice } = usePrices()
  const { weeklyEarnings } = useEarningsHistory(address)
  const { streakActive: realStreakActive } = useActivityStreak(address)
  const isMobile = useIsMobile()

  const navigate = useNavigate()
  const location = useLocation()
  const TAB_PATHS: Record<string, Tab> = { '': 'market', dashboard: 'dashboard', post: 'post', 'my-jobs': 'my', stats: 'stats', leaderboard: 'leaderboard', profile: 'profile' }
  const tab = TAB_PATHS[location.pathname.replace('/', '')] || 'dashboard'
  const setTab = (t: Tab) => navigate(t === 'dashboard' ? '/dashboard' : t === 'market' ? '/' : '/' + (t === 'my' ? 'my-jobs' : t))

  const needsLeaderboard = tab === 'dashboard' || tab === 'stats' || tab === 'leaderboard' || tab === 'profile'

  // Periodic auto-refresh — lighter and smarter to reduce jank during navigation
  const onChainJobsRef = useRef(onChainJobs)
  onChainJobsRef.current = onChainJobs
  useEffect(() => {
    const interval = setInterval(() => {
      refetchJobs(true) // silent jobs refresh (cheaper)
      if (needsLeaderboard) {
        fetchLeaderboard(onChainJobsRef.current, false)
      }
    }, 60000) // 60s instead of 30s
    return () => clearInterval(interval)
  }, [refetchJobs, fetchLeaderboard, needsLeaderboard, tab])

  const [loading, setLoading] = useState(false)
  const [releaseRefreshKey, setReleaseRefreshKey] = useState(0)
  const [claimingJobId, setClaimingJobId] = useState<number | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [submittingProof, setSubmittingProof] = useState(false)

  // ZK Solution input flow (replaces the old random-preimage "magic" ZK)
  const [zkSolutionJob, setZkSolutionJob] = useState<Job | null>(null)
  const [zkSolution, setZkSolution] = useState('')

  const entered = !!address

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('reward')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [proofHash, setProofHash] = useState('')
  const [showProofModal, setShowProofModal] = useState(false)
  const [currentProofJob, setCurrentProofJob] = useState<Job | null>(null)
  const [currentProofFile, setCurrentProofFile] = useState<File | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const [disputeState, setDisputeState] = useState<DisputeState>({ job: null, reason: '' })
  const [showDisputeModal, setShowDisputeModal] = useState(false)

  const [postSubTab, setPostSubTab] = useState<PostSubTab>('new')
  const [newJob, setNewJob] = useState<NewJobForm>({
    title: '', type: 'ML', reward: NaN, deadline: '', description: '', requirements: '', maxWorkers: NaN, token: 'zkLTC', customToken: '', difficulty: 'Medium',
    parameters: {}, inputData: '', expectedOutput: '', verificationMethod: 'hash-check',
  })

  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editSkillInput, setEditSkillInput] = useState('')
  const [viewedWorker, setViewedWorker] = useState<string | null>(null)
  const [viewedWorkerEntry, setViewedWorkerEntry] = useState<LeaderboardEntry | null>(null)
  const [viewedWorkerRank, setViewedWorkerRank] = useState(0)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const addNotification = (message: string, type: Notification['type'], jobTitle?: string) => {
    setNotifications(prev => [{ id: ++notifIdCounter, message, time: Date.now(), read: false, type, jobTitle }, ...prev].slice(0, 50))
  }

  const [editingPostedJob, setEditingPostedJob] = useState<Job | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editReqs, setEditReqs] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editParameters, setEditParameters] = useState<Record<string, string>>({})
  const [editInputData, setEditInputData] = useState('')
  const [editExpectedOutput, setEditExpectedOutput] = useState('')
  const [editVerificationMethod, setEditVerificationMethod] = useState('')

  useEffect(() => {
    if (address) {
      const profile = loadProfiles()[address.toLowerCase()]
      if (profile) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBio(profile.bio)
        setSkills(profile.skills)
        setAvatarUrl(profile.avatarUrl || '')
      }
    }
  }, [address])

  // Save profile with debounce
  useEffect(() => {
    if (!address || !(bio || skills.length > 0 || avatarUrl)) return
    const timer = setTimeout(() => {
      saveProfile(address, bio, skills, avatarUrl)
      scheduleRefresh(refetchJobs)
    }, 1000)
    return () => clearTimeout(timer)
  }, [address, bio, skills, avatarUrl])

  // Auto-sync local activities to Supabase on first visit after update
  useEffect(() => {
    if (!address) return

    const SYNCED_KEY = `zkcompute_synced_${address.toLowerCase()}`
    if (localStorage.getItem(SYNCED_KEY)) return

    const events: WorkerEvent[] = JSON.parse(localStorage.getItem('zkcompute_workers') || '[]')
    const myEvents = events.filter(e => e.worker === address.toLowerCase())
    if (myEvents.length === 0) return

    Promise.all(myEvents.map(e => saveWorkerEvent(e.status, {
      id: e.jobId,
      title: e.title,
      reward: e.reward,
      tokenSymbol: e.tokenSymbol,
    } as Job, e.worker))).then(() => {
      localStorage.setItem(SYNCED_KEY, '1')
      console.log(`Synced ${myEvents.length} activities to Supabase`)
    })
  }, [address])

  // Only fetch leaderboard when actually visiting those tabs (and avoid spamming on every render)
  useEffect(() => {
    if (needsLeaderboard && entered) {
      fetchLeaderboard(onChainJobs, false)
    }
  }, [tab, entered, fetchLeaderboard, onChainJobs, needsLeaderboard])

  // On first connect (or reconnect), if user is at root, send them to Dashboard.
  // We keep '/' as the Marketplace route so the tab still works.
  useEffect(() => {
    if (entered && location.pathname === '/') {
      navigate('/dashboard')
    }
  }, [entered])

  // Debounced profile save moved above

  const isWrongNetwork = entered && chainId !== 4441

  const switchToLitForge = () => {
    try {
      switchChain({ chainId: 4441 })
    } catch (e) {
      console.error('Network switch failed:', e)
      showToast('Please manually switch network in your wallet', 'info')
    }
  }

  const postJob = async () => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
    if (newJob.maxWorkers < 1) { showToast('Minimal 1 worker', 'info'); return }
    const rewardPerWorker = newJob.reward
    if (isNaN(rewardPerWorker) || rewardPerWorker <= 0) { showToast('Invalid reward amount', 'info'); return }
    const maxWorkers = newJob.maxWorkers
    if (!newJob.deadline) { showToast('Please set a deadline', 'info'); return }
    const deadlineTs = Date.parse(newJob.deadline)
    if (isNaN(deadlineTs)) { showToast('Invalid deadline format', 'info'); return }
    if (deadlineTs <= Date.now()) { showToast('Deadline must be in the future', 'info'); return }

    setLoading(true)
    try {
      let hash: `0x${string}`

      if (newJob.token === 'USDC') {
        const rewardBase = parseUnits(String(rewardPerWorker), USDC_DECIMALS)
        const totalBase = rewardBase * BigInt(maxWorkers)

        const approveHash = await writeContractAsync({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS as `0x${string}`, totalBase],
        })
        showToast(`Approving ${rewardPerWorker * maxWorkers} USDC... Tx: ${approveHash.slice(0, 10)}...`, 'success')

        hash = await writeContractAsync({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi,
          functionName: 'postJobUSDC',
          args: [newJob.title || 'Custom Compute Job', newJob.type, rewardBase, BigInt(maxWorkers), BigInt(Math.floor(deadlineTs / 1000))],
        })
      } else {
        const totalWei = parseUnits(String(rewardPerWorker), 18) * BigInt(maxWorkers)

        hash = await writeContractAsync({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi,
          functionName: 'postJobNative',
          args: [newJob.title || 'Custom Compute Job', newJob.type, BigInt(maxWorkers), BigInt(Math.floor(deadlineTs / 1000))],
          value: totalWei,
        })
      }

      let receipt: { status: string } | undefined
      try {
        receipt = await waitForTransactionReceipt(config, { hash })
      } catch (e) {
        console.warn('waitForTransactionReceipt failed, proceeding with direct read:', e)
      }
      if (receipt && receipt.status !== 'success') {
        showToast('Transaction failed on-chain', 'error')
        setLoading(false)
        return
      }

      const onChainId = Number(await readContract(config, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'jobCount',
      }))
      const now = Date.now()
      const normalizedDeadline = newJob.deadline ?? ''
        
      const job: Job = {
        id: onChainId,
        createdAt: now,
        title: newJob.title || 'Custom Compute Job',
        type: newJob.type,
        reward: rewardPerWorker,
        deadline: normalizedDeadline,
        description: newJob.description || 'No description',
        requirements: newJob.requirements || 'No requirements',
        poster: address,
        claimedCount: 0,
        maxWorkers,
        difficulty: newJob.difficulty || 'Medium',
        tokenSymbol: newJob.token === 'USDC' ? 'USDC' : 'zkLTC',
        parameters: newJob.parameters,
        inputData: newJob.inputData,
        expectedOutput: newJob.expectedOutput,
        verificationMethod: newJob.verificationMethod,
      }
      setJobs(prev => [...prev, job])
      const metaSaved = await saveJobMetadata({
        job_id: onChainId,
        poster: address.toLowerCase(),
        title: job.title,
        type: job.type,
        description: job.description,
        requirements: job.requirements,
        deadline: job.deadline,
        token_symbol: job.tokenSymbol || 'zkLTC',
        parameters: newJob.parameters,
        input_data: newJob.inputData,
        expected_output: newJob.expectedOutput,
        verification_method: newJob.verificationMethod,
      })
      if (!metaSaved) {
        console.warn('Job metadata might not be persisted — refetch may show generic details')
      }
      const tokenLabel = newJob.token === 'USDC' ? 'USDC' : 'zkLTC'
      setNewJob({ title: '', type: 'ML', reward: NaN, deadline: '', description: '', requirements: '', maxWorkers: NaN, token: 'zkLTC', customToken: '', difficulty: 'Medium', parameters: {}, inputData: '', expectedOutput: '', verificationMethod: 'hash-check' })
      showToast(`Job posted! ${rewardPerWorker * maxWorkers} ${tokenLabel} escrowed | Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Job posted: "${job.title}" — ${rewardPerWorker * maxWorkers} ${tokenLabel} escrowed`, 'post', job.title)
      scheduleRefresh(refetchJobs)
    } catch (e: unknown) {
      handleTxError(e, 'Post job', showToast)
    }
    setLoading(false)
  }

  const claimJob = async (job: Job) => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
    setClaimingJobId(job.id)
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'claimJob',
        args: [BigInt(job.id)],
      })
      const newClaimedCount = job.claimedCount + 1
      if (newClaimedCount >= job.maxWorkers) {
        setJobs(prev => prev.filter(j => j.id !== job.id))
      } else {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, claimedCount: newClaimedCount } : j))
      }
        setMyJobs(prev => {
            const seen = new Map(prev.map(j => [j.id, j]))
            seen.set(job.id, { ...job, status: 'claimed', escrow: true, claimedBy: address })
            return [...seen.values()]
        })
      setSelectedJob(null)
      saveWorkerEvent('claimed', job, address)
      showToast(`Job claimed! Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Job claimed: "${job.title}" — +${job.reward} ${job.tokenSymbol || 'zkLTC'}`, 'claim', job.title)
      scheduleRefresh(refetchJobs)
    } catch (e: unknown) {
      handleTxError(e, 'Claim job', showToast)
    }
    setClaimingJobId(null)
    setLoading(false)
  }

  const unclaimJob = (jobId: number) => {
    const job = myJobs.find(j => j.id === jobId)
    if (job) setConfirmAction({ type: 'unclaim', job })
  }

  const confirmUnclaim = () => {
    if (!confirmAction?.job) return
    const unclaimedJob = confirmAction.job
    setMyJobs(prev => prev.filter(j => j.id !== unclaimedJob.id))
    setJobs(prev => {
      const existing = prev.find(j => j.id === unclaimedJob.id)
      if (existing) {
        return prev.map(j => j.id === unclaimedJob.id ? { ...j, claimedCount: Math.max(0, j.claimedCount - 1) } : j)
      }
      return [...prev, { ...unclaimedJob, claimedCount: unclaimedJob.maxWorkers - 1 }]
    })
    showToast('Job unclaimed', 'info')
    setConfirmAction(null)
  }

  const openProofModal = (job: Job) => {
    setCurrentProofJob(job)
    setShowProofModal(true)
    setProofHash('')
    setCurrentProofFile(null)
  }

  const submitProof = async () => {
    if (!proofHash || !currentProofJob || !address) {
      showToast('Please enter proof hash', 'info')
      return
    }
    const job = currentProofJob
    setSubmittingProof(true)

    let proofUrl: string | null = ''
    if (currentProofFile) {
      proofUrl = await uploadProofFile(job.id, address, currentProofFile)
      if (!proofUrl) {
        showToast('Upload failed — make sure the "proofs" bucket exists in Supabase dashboard', 'error')
        setSubmittingProof(false)
        return
      }
    }

    setShowProofModal(false)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'submitProof',
        args: [BigInt(job.id), proofHash],
      })

      setMyJobs(prev => prev.map(j =>
        j.id === job.id && j.status !== 'paid' ? { ...j, status: 'completed' } : j
      ))
      saveWorkerEvent('completed', job, address, proofUrl, proofHash)
      showToast(`Proof submitted! Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Proof submitted: "${job.title}"`, 'proof', job.title)
      setTimeout(() => showToast('Stats updated: +1 job completed', 'info'), 800)
      scheduleRefresh(refetchJobs)
    } catch (e: unknown) {
      handleTxError(e, 'Submit proof', showToast)
    }
    setSubmittingProof(false)
    setProofHash('')
    setCurrentProofJob(null)
    setCurrentProofFile(null)
  }

  // Open the solution input UI for ZK jobs (called from MyJobs "SUBMIT ZK PROOF" button)
  const requestZKProof = (job: Job) => {
    setZkSolutionJob(job)
    setZkSolution('')
  }

  // The real ZK submission now requires a solution that satisfies:
  //   Poseidon(jobId, solution) === expectedOutput (as set by the poster)
  const submitZKProof = async (job: Job, solution: string) => {
    if (!address) {
      showToast('Connect wallet first', 'info')
      return
    }
    if (!solution || solution.trim() === '') {
      showToast('Please enter the solution / computed result for this job', 'info')
      return
    }

    const expected = job.expectedOutput || job.parameters?.expectedOutput || ''
    if (!expected || expected.trim() === '' || expected === '0') {
      showToast('This job does not have a ZK target (expectedOutput) set by the poster. Cannot generate verifiable proof.', 'error')
      return
    }

    setSubmittingProof(true)
    setZkSolutionJob(null)
    setZkSolution('')

    try {
      showToast('Generating ZK proof that you know the solution...', 'info')

      const { a, b, c, input, expectedOutput, solution: usedSolution } = await generateZKProof({
        jobId: job.id,
        solution: solution.trim(),
        expectedOutput: expected,
      })

      showToast(`Submitting ZK proof for on-chain verification...`, 'info')

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'submitZKProof',
        args: [BigInt(job.id), a, b, c, input],
      })

      setMyJobs(prev => prev.map(j =>
        j.id === job.id && j.status !== 'paid' ? { ...j, status: 'paid' } : j
      ))
      // Record the solution privately in activity (it is never revealed on-chain thanks to ZK)
      saveWorkerEvent('paid', job, address, '', `zk-solution:${usedSolution.slice(0, 10)}... target:${expectedOutput.slice(0, 10)}...`)
      showToast(`ZK proof verified & auto-paid! Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`ZK proof auto-paid: "${job.title}" (solution proven)`, 'payment', job.title)
      setTimeout(() => showToast('Stats updated: +1 job completed & paid', 'info'), 800)
      scheduleRefresh(() => { refetchJobs(); fetchLeaderboard(onChainJobs, true) })
    } catch (e: unknown) {
      handleTxError(e, 'Submit ZK proof', showToast)
    }
    setSubmittingProof(false)
  }

  const cancelZKProofInput = () => {
    setZkSolutionJob(null)
    setZkSolution('')
  }

  const releasePaymentForWorker = async (workerAddr: string, job: Job) => {
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'releasePayment',
        args: [BigInt(job.id), workerAddr as `0x${string}`],
      })
      saveWorkerEvent('paid', job, workerAddr)
      setMyJobs(prev => prev.map(j =>
        j.id === job.id ? { ...j, status: 'paid' } : j
      ))
      setReleaseRefreshKey(k => k + 1)
      showToast(`Payment released to ${workerAddr.slice(0, 6)}...${workerAddr.slice(-4)}! +${job.reward} ${job.tokenSymbol || 'zkLTC'} | Tx: ${hash.slice(0, 10)}...`, 'success')
      scheduleRefresh(() => { refetchJobs(); fetchLeaderboard(onChainJobs, true) })
    } catch (e: unknown) {
      handleTxError(e, 'Release payment for worker', showToast)
    }
    setLoading(false)
  }

  const deactivateJob = async (job: Job) => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
    setDeactivating(true)
    const token = job.tokenSymbol || 'zkLTC'
    const refundAmount = job.reward * job.maxWorkers
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'deactivateJob',
        args: [BigInt(job.id)],
      })
      setJobs(prev => prev.filter(j => j.id !== job.id))
      setMyJobs(prev => prev.filter(j => j.id !== job.id))
      showToast(`Job cancelled! +${refundAmount} ${token} refunded | Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Job cancelled & refunded: "${job.title}" — +${refundAmount} ${token}`, 'payment', job.title)
      scheduleRefresh(refetchJobs)
    } catch (e: unknown) {
      handleTxError(e, 'Cancel job', showToast)
    }
    setDeactivating(false)
    setConfirmAction(null)
  }

  const openDisputeModal = (job: Job, worker?: string) => {
    setDisputeState({ job, worker, reason: '' })
    setShowDisputeModal(true)
  }

  const submitDispute = () => {
    if (!disputeState.reason.trim()) {
      showToast('Please enter a reason', 'info')
      return
    }
    if (disputeState.reason.trim().length < 10) {
      showToast('Reason must be at least 10 characters', 'info')
      return
    }
    const worker = disputeState.worker || (address as string)
    setConfirmAction({ type: 'dispute', job: disputeState.job, disputeWorker: worker, disputeReason: disputeState.reason })
    setShowDisputeModal(false)
  }

  const confirmDispute = async () => {
    if (!confirmAction?.job || !confirmAction.disputeWorker) return
    const job = confirmAction.job
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'raiseDispute',
        args: [BigInt(job.id), confirmAction.disputeWorker as `0x${string}`, confirmAction.disputeReason || ''],
      })
      setMyJobs(prev => prev.map(j =>
        j.id === job.id ? { ...j, status: 'disputed' } : j
      ))
      showToast(`Dispute filed! Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Dispute filed for "${job.title}"`, 'dispute', job.title)
      scheduleRefresh(refetchJobs)
    } catch (e: unknown) {
      handleTxError(e, 'Raise dispute', showToast)
    }
    setLoading(false)
    setConfirmAction(null)
  }

  const resolveDispute = async (job: Job, acceptCancel: boolean) => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
    if (acceptCancel) {
      setConfirmAction({ type: 'resolveCancel', job, disputeWorker: address })
      return
    }
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'resolveDispute',
        args: [BigInt(job.id), address as `0x${string}`, false],
      })
      setMyJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'claimed' } : j))
      showToast(`Dispute rejected! Tx: ${hash.slice(0, 10)}...`, 'success')
    } catch (e: unknown) {
      handleTxError(e, 'Resolve dispute', showToast)
    }
    setLoading(false)
  }

  const confirmResolveCancel = async () => {
    if (!confirmAction?.job || !confirmAction.disputeWorker) return
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'resolveDispute',
        args: [BigInt(confirmAction.job.id), confirmAction.disputeWorker as `0x${string}`, true],
      })
      setMyJobs(prev => prev.filter(j => confirmAction.job && j.id !== confirmAction.job.id))
      showToast(`Claim cancelled! Tx: ${hash.slice(0, 10)}...`, 'success')
      scheduleRefresh(refetchJobs)
    } catch (e: unknown) {
      handleTxError(e, 'Resolve cancel', showToast)
    }
    setLoading(false)
    setConfirmAction(null)
  }

  // Memoize expensive derived lists so they don't recompute on every parent re-render (helps tab switches)
  const filteredJobs = useMemo(() => {
    return [...jobs]
      .filter(j => j.claimedCount < j.maxWorkers)
      .filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.type.toLowerCase().includes(search.toLowerCase()))
      .filter(j => !typeFilter || j.type === typeFilter)
      .filter(j => {
        const endMs = getDeadlineMs(j.createdAt, j.deadline)
        return endMs === null || endMs > Date.now()
      })
      .sort((a, b) => {
        if (sortBy === 'reward') {
          const price = ltcPrice ?? parseFloat(localStorage.getItem('zkcompute_ltc_price') || '51')
          const priceA = a.tokenSymbol === 'zkLTC' ? price * a.reward : a.reward
          const priceB = b.tokenSymbol === 'zkLTC' ? price * b.reward : b.reward
          return priceB - priceA || b.id - a.id
        }
        if (sortBy === 'deadline') {
          const aMs = getDeadlineMs(a.createdAt, a.deadline) ?? 0
          const bMs = getDeadlineMs(b.createdAt, b.deadline) ?? 0
          return aMs - bMs || b.id - a.id
        }
        return b.id - a.id
      })
  }, [jobs, search, typeFilter, sortBy, ltcPrice])

  const postedJobs = useMemo(() =>
    jobs.filter(j => address && j.poster.toLowerCase() === address.toLowerCase()),
    [jobs, address]
  )

  const confirmDeactivate = (job: Job) => {
    setConfirmAction({ type: 'deactivate', job, claimantCount: job.claimedCount })
  }

  const editPostedJob = (job: Job) => {
    setEditingPostedJob(job)
    setEditTitle(job.title)
    setEditType(job.type)
    setEditDesc(job.description)
    setEditReqs(job.requirements)
    setEditDeadline(job.deadline && job.deadline !== 'N/A'
      ? (() => {
          const parsed = Date.parse(job.deadline)
          if (!isNaN(parsed)) {
            const d = new Date(parsed)
            return d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0') + 'T' +
              String(d.getHours()).padStart(2, '0') + ':' +
              String(d.getMinutes()).padStart(2, '0')
          }
          return job.deadline
        })()
      : '')
    setEditParameters(job.parameters || {})
    setEditInputData(job.inputData || '')
    setEditExpectedOutput(job.expectedOutput || '')
    setEditVerificationMethod(job.verificationMethod || '')
  }

  const saveEditedJob = async () => {
    if (!editingPostedJob) return
    if (!editTitle.trim() || !editDeadline?.trim()) return
    setEditSaving(true)
    const prev = jobs.find(j => j.id === editingPostedJob.id)!
    const normalizedEditDeadline = editDeadline ?? (prev?.deadline ?? '')
    const updated: Job = { ...prev, title: editTitle, type: editType, description: editDesc, requirements: editReqs, deadline: normalizedEditDeadline, parameters: editParameters, inputData: editInputData, expectedOutput: editExpectedOutput, verificationMethod: editVerificationMethod, difficulty: prev.difficulty || 'Medium' }
    setJobs(prevJobs => prevJobs.map(j => j.id === editingPostedJob.id ? updated : j))
    const ok = await saveJobMetadata({
      job_id: editingPostedJob.id,
      poster: editingPostedJob.poster.toLowerCase(),
      title: editTitle,
      type: editType,
      description: editDesc,
      requirements: editReqs,
      deadline: normalizedEditDeadline,
      token_symbol: editingPostedJob.tokenSymbol || 'zkLTC',
      parameters: editParameters,
      input_data: editInputData,
      expected_output: editExpectedOutput,
      verification_method: editVerificationMethod,
    })
    if (!ok) {
      setJobs(prevJobs => prevJobs.map(j => j.id === editingPostedJob.id ? prev! : j))
      showToast('Failed to save metadata — changes reverted', 'error')
      setEditSaving(false)
      return
    }
    setEditingPostedJob(null)
    showToast('Job updated!', 'success')
    scheduleRefresh(refetchJobs)
    setEditSaving(false)
  }

  const cancelEdit = () => {
    setEditingPostedJob(null)
    setEditTitle('')
    setEditType('')
    setEditDesc('')
    setEditReqs('')
    setEditDeadline('')
    setEditParameters({})
    setEditInputData('')
    setEditExpectedOutput('')
    setEditVerificationMethod('')
  }

  const boostJob = async (jobId: number, boostAmount: number) => {
    if (!address) {
      showToast('Connect wallet first', 'info')
      return
    }
    setLoading(true)
    try {
      const totalWei = parseUnits(String(boostAmount), 18)
      // Real platform fee payment: send native zkLTC to the contract as booster fee to the developer/platform.
      // This does NOT increase the worker reward — it's purely a visibility fee.
      // In full production: add `function boostJob(uint256 jobId) external payable` in the contract
      // that only the poster can call, records the boost (e.g. boostedUntil), and the value stays with the contract owner.
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: [{ type: 'receive', stateMutability: 'payable' } as const],
        functionName: 'receive' as any,
        value: totalWei,
      })

      // Persist boost status in off-chain metadata (used for UI badge, sorting priority in Marketplace, and recommendations)
      await saveJobMetadata({
        job_id: jobId,
        poster: address.toLowerCase(),
        boost_amount: boostAmount,
        boosted_until: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      } as any)

      showToast(`Job #${jobId} boosted! Paid ${boostAmount} zkLTC platform fee. Tx: ${hash.slice(0, 10)}...`, 'success')
      scheduleRefresh(refetchJobs)
    } catch (e: unknown) {
      handleTxError(e, 'Boost job', showToast)
    }
    setLoading(false)
  }

  const handleViewWorker = (workerAddr: string, entry: LeaderboardEntry, rank: number) => {
    setViewedWorker(workerAddr)
    setViewedWorkerEntry(entry)
    setViewedWorkerRank(rank)
  }

  if (!entered) {
    return <LandingPage />
  }

  return (
    <div className="app-container">
      {/* Lightweight static background (heavy animations removed for snappier navigation) */}
      <div className={`app-bg app-bg--${tab}`} />

      <Navbar
        tab={tab} setTab={setTab}
        entered={entered}
        onSwitchNetwork={switchToLitForge}
        isWrongNetwork={isWrongNetwork}
        notifications={notifications}
        setNotifications={setNotifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
      />

      <div style={{ padding: isMobile ? '14px 14px' : '20px 24px' }}>
        <Suspense fallback={<PageSkeleton isMobile={isMobile} />}>
        <Routes>
          <Route path="/dashboard" element={
            <Dashboard
              myJobs={myJobs}
              onChainJobs={onChainJobs}
              leaderboard={leaderboard}
              ltcPrice={ltcPrice}
              address={address || ''}
              onNavigate={setTab}
              onBoostJob={boostJob}
              loading={jobsLoading || leaderboardLoading}
              error={jobsError}
              realWeeklyEarnings={weeklyEarnings}
              realStreakActive={realStreakActive}
            />
          } />
          <Route path="/" element={
            <Marketplace
              jobs={filteredJobs}
              search={search} setSearch={setSearch}
              typeFilter={typeFilter} setTypeFilter={setTypeFilter}
              sortBy={sortBy} setSortBy={setSortBy}
              onClaim={claimJob} onDetail={setSelectedJob}
              claimingJobId={claimingJobId} jobsLoading={jobsLoading}
              jobsError={jobsError} onRetry={refetchJobs}
            />
          } />
          <Route path="/post" element={
            <PostJob
              postSubTab={postSubTab} setPostSubTab={setPostSubTab}
              newJob={newJob} setNewJob={setNewJob}
              postedJobs={postedJobs}
              onPost={postJob} onReleaseWorker={releasePaymentForWorker}
              onDeactivate={confirmDeactivate}
              onDispute={openDisputeModal}
              loading={loading}
              deactivating={deactivating}
              onEditPostedJob={editPostedJob}
              editingPostedJob={editingPostedJob}
              editTitle={editTitle} setEditTitle={setEditTitle}
              editType={editType} setEditType={setEditType}
              editDesc={editDesc} setEditDesc={setEditDesc}
              editReqs={editReqs} setEditReqs={setEditReqs}
              editDeadline={editDeadline} setEditDeadline={setEditDeadline}
              editParameters={editParameters} setEditParameters={setEditParameters}
              editInputData={editInputData} setEditInputData={setEditInputData}
              editExpectedOutput={editExpectedOutput} setEditExpectedOutput={setEditExpectedOutput}
              editVerificationMethod={editVerificationMethod} setEditVerificationMethod={setEditVerificationMethod}
              onSaveEdit={saveEditedJob} onCancelEdit={cancelEdit} editSaving={editSaving}
              releaseRefreshKey={releaseRefreshKey}
            />
          } />
          <Route path="/my-jobs" element={
            <MyJobs
              myJobs={myJobs}
              onOpenProof={openProofModal}
              onSubmitZKProof={requestZKProof}
              onUnclaim={unclaimJob}
              loading={loading}
              submittingProof={submittingProof}
              onDispute={openDisputeModal}
              onResolveDispute={resolveDispute}
            />
          } />
          <Route path="/stats" element={
            <Stats
              onChainJobs={onChainJobs}
              leaderboard={leaderboard}
              ltcPrice={ltcPrice}
              address={address || ''}
              loading={jobsLoading || leaderboardLoading}
              error={jobsError}
              onRetry={() => { refetchJobs(); fetchLeaderboard(onChainJobs, true) }}
            />
          } />
          <Route path="/leaderboard" element={
            <Leaderboard
              leaderboard={leaderboard}
              leaderboardLoading={leaderboardLoading}
              onViewWorker={handleViewWorker}
              ltcPrice={ltcPrice}
              onChainJobs={onChainJobs}
              onRetry={() => fetchLeaderboard(onChainJobs, true)}
            />
          } />
          <Route path="/profile" element={
            <Profile
              account={address || ''}
              myJobs={myJobs}
              bio={bio} skills={skills} avatarUrl={avatarUrl}
              setEditBio={setEditBio} setShowEditProfile={setShowEditProfile}
              leaderboard={leaderboard}
              ltcPrice={ltcPrice}
              loading={leaderboardLoading}
              onRetry={() => fetchLeaderboard(onChainJobs, true)}
              onNavigate={setTab}
            />
          } />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
              Page not found. <a onClick={() => navigate('/')} style={{ color: colors.gold, cursor: 'pointer', textDecoration: 'underline' }}>Go to Marketplace</a>
            </div>
          } />
        </Routes>
        </Suspense>
      </div>

      <ToastContainer toasts={toasts} />

      {showProofModal && currentProofJob && (
        <ProofModal
          job={currentProofJob}
          proofHash={proofHash}
          onProofHashChange={setProofHash}
          onProofFileChange={setCurrentProofFile}
          onSubmit={submitProof}
          onClose={() => setShowProofModal(false)}
          loading={submittingProof}
        />
      )}

      {showEditProfile && (
        <EditProfileModal
          editBio={editBio} setEditBio={setEditBio}
          editSkillInput={editSkillInput} setEditSkillInput={setEditSkillInput}
          skills={skills} setSkills={setSkills}
          onClose={() => setShowEditProfile(false)}
          onSave={() => { setBio(editBio); setShowEditProfile(false); if (address) { saveProfile(address, editBio, skills, avatarUrl); scheduleRefresh(refetchJobs) } }}
          account={address || ''}
          currentAvatarUrl={avatarUrl}
          onAvatarChange={(url) => setAvatarUrl(url)}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onCancel={() => setConfirmAction(null)}
          onConfirm={
            confirmAction.type === 'unclaim' ? confirmUnclaim :
            confirmAction.type === 'deactivate' ? () => { if (confirmAction.job) deactivateJob(confirmAction.job); setConfirmAction(null) } :
            confirmAction.type === 'dispute' ? confirmDispute :
            confirmAction.type === 'resolveCancel' ? confirmResolveCancel :
            () => {}
          }
        />
      )}

      {showDisputeModal && (
        <DisputeModal
          dispute={disputeState}
          onReasonChange={(v) => setDisputeState({ ...disputeState, reason: v })}
          onSubmit={submitDispute}
          onClose={() => setShowDisputeModal(false)}
          loading={loading}
        />
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onClaim={claimJob}
          loading={loading}
        />
      )}

      {viewedWorker && (
        <WorkerProfileModal
          worker={viewedWorker}
          leaderboardEntry={viewedWorkerEntry}
          rank={viewedWorkerRank}
          onClose={() => { setViewedWorker(null); setViewedWorkerEntry(null); setViewedWorkerRank(0) }}
          ltcPrice={ltcPrice}
        />
      )}

      {/* ZK Solution Input Modal - this is the key UX change for meaningful ZK proofs */}
      {zkSolutionJob && (
        <ZKSolutionModal
          job={zkSolutionJob}
          solution={zkSolution}
          onSolutionChange={setZkSolution}
          onSubmit={() => submitZKProof(zkSolutionJob, zkSolution)}
          onClose={cancelZKProofInput}
          loading={submittingProof}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({ accentColor: '#F7CE3E', accentColorForeground: '#0A1612', borderRadius: 'small', fontStack: 'system' })}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
