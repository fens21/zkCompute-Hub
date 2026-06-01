import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useAccount, useBalance, useWriteContract, useSwitchChain, useChainId } from 'wagmi'
import { readContract } from '@wagmi/core'
import abi from './abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS, USDC_ADDRESS } from './config/chain'
import { useToasts } from './hooks/useToasts'
import { useJobs } from './hooks/useJobs'
import { useMyJobs, saveWorkerEvent } from './hooks/useMyJobs'
import { useLeaderboard } from './hooks/useLeaderboard'
import { usePrices } from './hooks/usePrices'
import { LandingPage } from './components/LandingPage'
import { Navbar } from './components/Navbar'
import { Marketplace } from './components/Marketplace'
import { PostJob } from './components/PostJob'
import { MyJobs } from './components/MyJobs'
import { Stats } from './components/Stats'
import { Leaderboard } from './components/Leaderboard'
import { Profile } from './components/Profile'
import { ToastContainer } from './components/ToastContainer'
import { JobDetailModal, ProofModal, ConfirmModal, EditProfileModal, DisputeModal } from './components/Modals'
import { WorkerProfileModal } from './components/WorkerProfileModal'
import type { Job, NewJobForm, ConfirmAction, DisputeState, Tab, PostSubTab, SortBy, LeaderboardEntry, WorkerEvent, Notification } from './types'
import { saveProfile, loadProfiles, uploadProofFile } from './hooks/useWorkerProfiles'
import { saveJobMetadata } from './hooks/useJobMetadata'
import { handleTxError, getDeadlineMs } from './utils'

const USDC_DECIMALS = 6
const ERC20_ABI = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const

const queryClient = new QueryClient()
let notifIdCounter = 0

function AppContent() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: balance } = useBalance({ address, chainId: 4441 })
  const { writeContractAsync } = useWriteContract()

  const { toasts, showToast } = useToasts()
  const { jobs, setJobs, onChainJobs, loading: jobsLoading, error: jobsError, refetch: refetchJobs } = useJobs(true)
  const { myJobs, setMyJobs } = useMyJobs(address, true)
  const { leaderboard, loading: leaderboardLoading, fetchLeaderboard } = useLeaderboard()
  const { ltcPrice } = usePrices()

  const navigate = useNavigate()
  const location = useLocation()
  const TAB_PATHS: Record<string, Tab> = { '': 'market', post: 'post', 'my-jobs': 'my', stats: 'stats', leaderboard: 'leaderboard', profile: 'profile' }
  const tab = TAB_PATHS[location.pathname.replace('/', '')] || 'market'
  const setTab = (t: Tab) => navigate(t === 'market' ? '/' : '/' + (t === 'my' ? 'my-jobs' : t))

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [entered, setEntered] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [submittingProof, setSubmittingProof] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const wasEntered = sessionStorage.getItem('zkcompute_session') === 'true'
    if (wasEntered) {
      setEntered(true)
    }
    setSessionChecked(true)
  }, [])

  // Listen for account changes from wallet extension (Brave, MetaMask, etc.)
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts : typeof accounts === 'string' ? [accounts] : []
      if (list.length === 0) {
        sessionStorage.removeItem('zkcompute_session')
        setEntered(false)
        setShowWalletMenu(false)
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [])

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
    title: '', type: 'ML', reward: 50, deadline: '', description: '', requirements: '', maxWorkers: 3, token: 'zkLTC', customToken: '', difficulty: 'Medium'
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
  const [editDifficulty, setEditDifficulty] = useState('')

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

  useEffect(() => {
    if ((tab === 'stats' || tab === 'leaderboard' || tab === 'profile') && entered) fetchLeaderboard(onChainJobs, false)
  }, [tab, entered, fetchLeaderboard, onChainJobs])

  useEffect(() => {
    if (address && (bio || skills.length > 0 || avatarUrl)) {
      saveProfile(address, bio, skills, avatarUrl)
    }
  }, [address, bio, skills, avatarUrl])

  const isWrongNetwork = entered && chainId !== 4441

  const connectWallet = async () => {
    setLoading(true)
    try {
      if (!window.ethereum) {
        showToast('Please install MetaMask or Brave Wallet', 'error')
        setLoading(false)
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (!accounts || accounts.length === 0) {
        showToast('No accounts found', 'info')
        setLoading(false)
        return
      }

      sessionStorage.setItem('zkcompute_session', 'true')
      setEntered(true)
      showToast(`Connected: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`, 'success')
      navigate('/')
      try {
        switchChain({ chainId: 4441 })
      } catch {
        showToast('Please manually switch to LitForge Testnet in your wallet', 'info')
      }
    } catch (e) {
      console.error('Wallet connection failed:', e)
      showToast('Wallet connection cancelled or failed', 'error')
    }
    setLoading(false)
  }

  const switchToLitForge = () => {
    try {
      switchChain({ chainId: 4441 })
    } catch (e) {
      console.error('Network switch failed:', e)
      showToast('Please manually switch network in your wallet', 'info')
    }
  }

  const disconnect = () => {
    sessionStorage.removeItem('zkcompute_session')
    setEntered(false)
    setShowWalletMenu(false)
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
      let hash: string

      if (newJob.token === 'USDC') {
        const rewardBase = BigInt(Math.round(rewardPerWorker * (10 ** USDC_DECIMALS)))
        const totalBase = rewardBase * BigInt(maxWorkers)

        const approveHash = await writeContractAsync({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS as `0x${string}`, totalBase],
        })
        showToast(`Approving ${Number(totalBase) / (10 ** USDC_DECIMALS)} USDC... Tx: ${approveHash.slice(0, 10)}...`, 'success')

        hash = await writeContractAsync({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi,
          functionName: 'postJobUSDC',
          args: [newJob.title || 'Custom Compute Job', newJob.type, rewardBase, BigInt(maxWorkers)],
        })
      } else {
        const totalWei = BigInt(Math.round(rewardPerWorker * 1e18)) * BigInt(maxWorkers)

        hash = await writeContractAsync({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi,
          functionName: 'postJobNative',
          args: [newJob.title || 'Custom Compute Job', newJob.type, BigInt(maxWorkers)],
          value: totalWei,
        })
      }

      const onChainId = Number(await readContract(config, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'jobCount',
      }))
      const now = Date.now()
      const job: Job = {
        id: onChainId,
        createdAt: now,
        title: newJob.title || 'Custom Compute Job',
        type: newJob.type,
        reward: rewardPerWorker,
        deadline: newJob.deadline || '4h',
        description: newJob.description || 'No description',
        requirements: newJob.requirements || 'No requirements',
        poster: address || '0x0000000000000000000000000000000000000000',
        claimedCount: 0,
        maxWorkers,
        difficulty: newJob.difficulty,
        tokenSymbol: newJob.token === 'USDC' ? 'USDC' : 'zkLTC',
      }
      setJobs(prev => [...prev, job])
      saveJobMetadata({
        job_id: onChainId,
        poster: address?.toLowerCase() || '',
        title: job.title,
        type: job.type,
        description: job.description,
        requirements: job.requirements,
        deadline: job.deadline,
        token_symbol: job.tokenSymbol || 'zkLTC',
        difficulty: job.difficulty,
      })
      const tokenLabel = newJob.token === 'USDC' ? 'USDC' : 'zkLTC'
      setNewJob({ title: '', type: 'ML', reward: 50, deadline: '', description: '', requirements: '', maxWorkers: 3, token: 'zkLTC', customToken: '', difficulty: 'Medium' })
      showToast(`Job posted! ${rewardPerWorker * maxWorkers} ${tokenLabel} escrowed | Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Job posted: "${job.title}" — ${rewardPerWorker * maxWorkers} ${tokenLabel} escrowed`, 'post', job.title)
    } catch (e: unknown) {
      handleTxError(e, 'Post job', showToast)
    }
    setLoading(false)
  }

  const claimJob = async (job: Job) => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
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
        if (prev.some(j => j.id === job.id)) return prev
        return [...prev, { ...job, status: 'claimed', escrow: true, claimedBy: address }]
      })
      setSelectedJob(null)
      saveWorkerEvent('claimed', job, address)
      showToast(`Job claimed! Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Job claimed: "${job.title}" — +${job.reward} ${job.tokenSymbol || 'zkLTC'}`, 'claim', job.title)
    } catch (e: unknown) {
      handleTxError(e, 'Claim job', showToast)
    }
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

    let proofUrl = ''
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
        j.id === job.id ? { ...j, status: 'completed' } : j
      ))
      saveWorkerEvent('completed', job, address, proofUrl, proofHash)
      showToast(`Proof submitted! Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Proof submitted: "${job.title}"`, 'proof', job.title)
      setTimeout(() => showToast('Stats updated: +1 job completed', 'info'), 800)
    } catch (e: unknown) {
      handleTxError(e, 'Submit proof', showToast)
    }
    setSubmittingProof(false)
    setProofHash('')
    setCurrentProofJob(null)
    setCurrentProofFile(null)
  }

  const releasePayment = async (job: Job) => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
    setReleasing(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'releasePayment',
        args: [BigInt(job.id), address as `0x${string}`],
      })
      setMyJobs(prev => prev.map(j =>
        j.id === job.id ? { ...j, status: 'paid' } : j
      ))
      saveWorkerEvent('paid', job, address)
      showToast(`Payment released! +${job.reward} ${job.tokenSymbol || 'zkLTC'} | Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Payment received: +${job.reward} ${job.tokenSymbol || 'zkLTC'} for "${job.title}"`, 'payment', job.title)
    } catch (e: unknown) {
      handleTxError(e, 'Release payment', showToast)
    }
    setReleasing(false)
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
      showToast(`Payment released to ${workerAddr.slice(0, 6)}...${workerAddr.slice(-4)}! +${job.reward} ${job.tokenSymbol || 'zkLTC'} | Tx: ${hash.slice(0, 10)}...`, 'success')
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
    const worker = disputeState.worker || (address as string)
    setConfirmAction({ type: 'dispute', job: disputeState.job, disputeWorker: worker, disputeReason: disputeState.reason })
    setShowDisputeModal(false)
  }

  const confirmDispute = async () => {
    if (!confirmAction?.job || !confirmAction.disputeWorker) return
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'raiseDispute',
        args: [BigInt(confirmAction.job.id), confirmAction.disputeWorker as `0x${string}`, confirmAction.disputeReason || ''],
      })
      showToast(`Dispute filed! Tx: ${hash.slice(0, 10)}...`, 'success')
      addNotification(`Dispute filed for "${confirmAction.job.title}"`, 'dispute', confirmAction.job.title)
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
      setMyJobs(prev => prev.filter(j => j.id !== confirmAction.job!.id))
      showToast(`Claim cancelled! Tx: ${hash.slice(0, 10)}...`, 'success')
    } catch (e: unknown) {
      handleTxError(e, 'Resolve cancel', showToast)
    }
    setLoading(false)
    setConfirmAction(null)
  }

  const filteredJobs = [...jobs]
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

  const postedJobs = jobs.filter(j => address && j.poster.toLowerCase() === (address || '').toLowerCase())

  const confirmDeactivate = (job: Job) => {
    setConfirmAction({ type: 'deactivate', job, claimantCount: job.claimedCount })
  }

  const editPostedJob = (job: Job) => {
    setEditingPostedJob(job)
    setEditTitle(job.title)
    setEditType(job.type)
    setEditDesc(job.description)
    setEditReqs(job.requirements)
    setEditDeadline(job.deadline && job.deadline !== 'N/A' ? job.deadline : '')
    setEditDifficulty(job.difficulty)
  }

  const saveEditedJob = () => {
    if (!editingPostedJob) return
    setJobs(prev => prev.map(j => j.id === editingPostedJob.id ? { ...j, title: editTitle, type: editType, description: editDesc, requirements: editReqs, deadline: editDeadline || j.deadline, difficulty: editDifficulty } : j))
    saveJobMetadata({
      job_id: editingPostedJob.id,
      poster: editingPostedJob.poster.toLowerCase(),
      title: editTitle,
      type: editType,
      description: editDesc,
      requirements: editReqs,
      deadline: editDeadline || editingPostedJob.deadline,
      token_symbol: editingPostedJob.tokenSymbol || 'zkLTC',
      difficulty: editDifficulty || editingPostedJob.difficulty,
    })
    setEditingPostedJob(null)
    showToast('Job updated!', 'success')
  }

  const cancelEdit = () => {
    setEditingPostedJob(null)
    setEditTitle('')
    setEditType('')
    setEditDesc('')
    setEditReqs('')
    setEditDeadline('')
    setEditDifficulty('')
  }

  const handleViewWorker = (workerAddr: string, entry: LeaderboardEntry, rank: number) => {
    setViewedWorker(workerAddr)
    setViewedWorkerEntry(entry)
    setViewedWorkerRank(rank)
  }

  if (!sessionChecked) {
    // Wait for session check to finish — prevent landing page flash on reload
    return null
  }

  if (!entered) {
    return <LandingPage onConnect={connectWallet} loading={loading} />
  }

  return (
    <div className="app-container">
      <Navbar
        tab={tab} setTab={setTab}
        account={address || ''} entered={entered}
        balance={balance}
        loading={loading} showWalletMenu={showWalletMenu}
        setShowWalletMenu={setShowWalletMenu}
        onConnect={connectWallet} onDisconnect={disconnect}
        onSwitchNetwork={switchToLitForge}
        isWrongNetwork={isWrongNetwork}
        notifications={notifications}
        setNotifications={setNotifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
      />

      <div style={{ padding: isMobile ? '14px 14px' : '20px 24px' }}>
        <Routes>
          <Route path="/" element={
            <Marketplace
              jobs={filteredJobs}
              search={search} setSearch={setSearch}
              typeFilter={typeFilter} setTypeFilter={setTypeFilter}
              sortBy={sortBy} setSortBy={setSortBy}
              onClaim={claimJob} onDetail={setSelectedJob}
              loading={loading} jobsLoading={jobsLoading}
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
              editDifficulty={editDifficulty} setEditDifficulty={setEditDifficulty}
              onSaveEdit={saveEditedJob}
              onCancelEdit={cancelEdit}
              address={address}
            />
          } />
          <Route path="/my-jobs" element={
            <MyJobs
              myJobs={myJobs}
              onOpenProof={openProofModal} onUnclaim={unclaimJob}
              onRelease={releasePayment} loading={loading}
              submittingProof={submittingProof}
              releasing={releasing}
              onDispute={openDisputeModal}
              onResolveDispute={resolveDispute}
              address={address || ''}
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
            />
          } />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
              Page not found. <a onClick={() => navigate('/')} style={{ color: '#ffd700', cursor: 'pointer', textDecoration: 'underline' }}>Go to Marketplace</a>
            </div>
          } />
        </Routes>
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
          onSave={() => { setBio(editBio); setShowEditProfile(false); if (address) saveProfile(address, editBio, skills, avatarUrl) }}
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
            confirmAction.type === 'deactivate' ? () => { deactivateJob(confirmAction.job!); setConfirmAction(null) } :
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
    </div>
  )
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
