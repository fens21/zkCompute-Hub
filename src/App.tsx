import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useAccount, useBalance, useWriteContract, useSwitchChain, useChainId } from 'wagmi'
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
import type { Job, NewJobForm, ConfirmAction, DisputeState, Tab, PostSubTab, SortBy, LeaderboardEntry, WorkerEvent } from './types'
import { saveProfile, loadProfiles, loadProfilesRemote } from './hooks/useWorkerProfiles'
import { handleTxError } from './utils'

const USDC_DECIMALS = 6
const ERC20_ABI = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const

const queryClient = new QueryClient()

function AppContent() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: balance } = useBalance({ address, chainId: 4441 })
  const { writeContractAsync } = useWriteContract()

  const { toasts, showToast } = useToasts()
  const { jobs, setJobs, onChainJobs } = useJobs(true)
  const { myJobs, setMyJobs } = useMyJobs(address, true)
  const { leaderboard, loading: leaderboardLoading, fetchLeaderboard } = useLeaderboard()
  const { ltcPrice } = usePrices()

  const [tab, setTab] = useState<Tab>('market')
  const [account, setAccount] = useState('')
  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('reward')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [proofHash, setProofHash] = useState('')
  const [showProofModal, setShowProofModal] = useState(false)
  const [currentProofJob, setCurrentProofJob] = useState<Job | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const [disputeState, setDisputeState] = useState<DisputeState>({ job: {} as Job, reason: '' })
  const [showDisputeModal, setShowDisputeModal] = useState(false)

  const [postSubTab, setPostSubTab] = useState<PostSubTab>('new')
  const [newJob, setNewJob] = useState<NewJobForm>({
    title: '', type: 'ML', reward: 50, deadline: '4', description: '', requirements: '', maxWorkers: 3, token: 'zkLTC', customToken: ''
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
    if (localStorage.getItem(SYNCED_KEY)) return // sudah pernah sync

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
    console.log('Connect wallet button clicked')
    setLoading(true)
    try {
      const accounts = await window.ethereum?.request({ method: 'eth_requestAccounts' }) as string[]
      if (!accounts || accounts.length === 0) {
        showToast('No accounts found', 'info')
        setLoading(false)
        return
      }
      setAccount(accounts[0])
      setEntered(true)
      showToast('Switching to LitForge Testnet...', 'info')
      try {
        switchChain({ chainId: 4441 })
      } catch {
        showToast('Please manually switch to LitForge Testnet in your wallet', 'info')
      }
    } catch (e) {
      console.error('Wallet connection failed:', e)
      alert('Please install MetaMask or Brave Wallet')
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
    setAccount('')
    setEntered(false)
    setShowWalletMenu(false)
  }

  const postJob = async () => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
    if (newJob.maxWorkers < 1) { showToast('Minimal 1 worker', 'info'); return }
    const rewardPerWorker = newJob.reward
    if (isNaN(rewardPerWorker) || rewardPerWorker <= 0) { showToast('Invalid reward amount', 'info'); return }
    const maxWorkers = newJob.maxWorkers

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
        showToast(`Approving ${Number(totalBase) / (10 ** USDC_DECIMALS)} USDC... Tx: ${approveHash.slice(0, 10)}...`, 'info')

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

      const job: Job = {
        id: Date.now(),
        title: newJob.title || 'Custom Compute Job',
        type: newJob.type,
        reward: rewardPerWorker,
        deadline: newJob.deadline + 'h',
        description: newJob.description || 'No description',
        requirements: newJob.requirements || 'No requirements',
        poster: account || '0x0000000000000000000000000000000000000000',
        claimedCount: 0,
        maxWorkers,
        difficulty: 'Medium',
        tokenSymbol: newJob.token === 'USDC' ? 'USDC' : 'zkLTC',
      }
      setJobs([...jobs, job])
      const tokenLabel = newJob.token === 'USDC' ? 'USDC' : 'zkLTC'
      setNewJob({ title: '', type: 'ML', reward: 50, deadline: '4', description: '', requirements: '', maxWorkers: 3, token: 'zkLTC', customToken: '' })
      showToast(`Job posted! ${rewardPerWorker * maxWorkers} ${tokenLabel} escrowed | Tx: ${hash.slice(0, 10)}...`, 'success')
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
        setJobs(jobs.filter(j => j.id !== job.id))
      } else {
        setJobs(jobs.map(j => j.id === job.id ? { ...j, claimedCount: newClaimedCount } : j))
      }
      setMyJobs(prev => {
        if (prev.some(j => j.id === job.id)) return prev
        return [...prev, { ...job, status: 'claimed', escrow: true, claimedBy: address }]
      })
      setSelectedJob(null)
      saveWorkerEvent('claimed', job, address)
      showToast(`Job claimed! Tx: ${hash.slice(0, 10)}...`, 'success')
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
    const existing = jobs.find(j => j.id === unclaimedJob.id)
    if (existing) {
      setJobs(jobs.map(j => j.id === unclaimedJob.id ? { ...j, claimedCount: Math.max(0, j.claimedCount - 1) } : j))
    } else {
      setJobs([...jobs, { ...unclaimedJob, claimedCount: unclaimedJob.maxWorkers - 1 }])
    }
    showToast('Job unclaimed', 'info')
    setConfirmAction(null)
  }

  const openProofModal = (job: Job) => {
    setCurrentProofJob(job)
    setShowProofModal(true)
    setProofHash('')
  }

  const submitProof = async () => {
    if (!proofHash || !currentProofJob) {
      showToast('Please enter proof hash', 'info')
      return
    }
    setConfirmAction({ type: 'submit', job: currentProofJob })
    setShowProofModal(false)
  }

  const confirmSubmitProof = async () => {
    if (!confirmAction?.job || !address) return
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'submitProof',
        args: [BigInt(confirmAction.job.id), proofHash],
      })

      setMyJobs(prev => prev.map(j =>
        j.id === confirmAction.job!.id ? { ...j, status: 'completed' } : j
      ))
      saveWorkerEvent('completed', confirmAction.job!, address)
      showToast(`Proof submitted! Tx: ${hash.slice(0, 10)}...`, 'success')
      setTimeout(() => showToast('Stats updated: +1 job completed', 'info'), 800)
    } catch (e: unknown) {
      handleTxError(e, 'Submit proof', showToast)
    }
    setLoading(false)
    setProofHash('')
    setCurrentProofJob(null)
    setConfirmAction(null)
  }

  const releasePayment = async (job: Job) => {
    if (!address) { showToast('Connect wallet first', 'info'); return }
    setLoading(true)
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
    } catch (e: unknown) {
      handleTxError(e, 'Release payment', showToast)
    }
    setLoading(false)
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
    setLoading(true)
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'deactivateJob',
        args: [BigInt(job.id)],
      })
      setJobs(jobs.filter(j => j.id !== job.id))
      setMyJobs(prev => prev.filter(j => j.id !== job.id))
      showToast(`Job deactivated! Tx: ${hash.slice(0, 10)}...`, 'success')
    } catch (e: unknown) {
      handleTxError(e, 'Deactivate job', showToast)
    }
    setLoading(false)
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
    .sort((a, b) => {
      if (sortBy === 'reward') {
        const price = ltcPrice ?? parseFloat(localStorage.getItem('zkcompute_ltc_price') || '51')
        const priceA = a.tokenSymbol === 'zkLTC' ? price * a.reward : a.reward
        const priceB = b.tokenSymbol === 'zkLTC' ? price * b.reward : b.reward
        return priceB - priceA || b.id - a.id
      }
      if (sortBy === 'deadline') return parseInt(a.deadline) - parseInt(b.deadline) || b.id - a.id
      return b.id - a.id
    })

  const postedJobs = jobs.filter(j => address && j.poster.toLowerCase() === (address || '').toLowerCase())

  const handleViewWorker = (workerAddr: string, entry: LeaderboardEntry, rank: number) => {
    setViewedWorker(workerAddr)
    setViewedWorkerEntry(entry)
    setViewedWorkerRank(rank)
  }

  if (!entered) {
    return <LandingPage onConnect={connectWallet} loading={loading} />
  }

  return (
    <div className="app-container">
      <Navbar
        tab={tab} setTab={setTab}
        account={account || address || ''} entered={entered}
        balance={balance}
        loading={loading} showWalletMenu={showWalletMenu}
        setShowWalletMenu={setShowWalletMenu}
        onConnect={connectWallet} onDisconnect={disconnect}
        onSwitchNetwork={switchToLitForge}
        isWrongNetwork={isWrongNetwork}
      />

      <div style={{ padding: '20px 24px' }}>
        {tab === 'market' && (
          <Marketplace
            jobs={filteredJobs}
            search={search} setSearch={setSearch}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            onClaim={claimJob} onDetail={setSelectedJob}
            loading={loading}
          />
        )}
        {tab === 'post' && (
          <PostJob
            postSubTab={postSubTab} setPostSubTab={setPostSubTab}
            newJob={newJob} setNewJob={setNewJob}
            postedJobs={postedJobs}
            onPost={postJob} onReleaseWorker={releasePaymentForWorker}
            onDeactivate={deactivateJob}
            onDispute={openDisputeModal}
            loading={loading} account={account || address || ''}
          />
        )}
        {tab === 'my' && (
          <MyJobs
            myJobs={myJobs} address={address}
            onOpenProof={openProofModal} onUnclaim={unclaimJob}
            onRelease={releasePayment} loading={loading}
            onDispute={openDisputeModal}
            onResolveDispute={resolveDispute}
          />
        )}
        {tab === 'stats' && (
          <Stats
            onChainJobs={onChainJobs}
            leaderboard={leaderboard}
            ltcPrice={ltcPrice}
            address={address || ''}
          />
        )}
        {tab === 'leaderboard' && (
          <Leaderboard
            leaderboard={leaderboard}
            leaderboardLoading={leaderboardLoading}
            onViewWorker={handleViewWorker}
            ltcPrice={ltcPrice}
          />
        )}
        {tab === 'profile' && (
          <Profile
            account={account || address || ''}
            myJobs={myJobs}
            bio={bio} skills={skills} avatarUrl={avatarUrl}
            setEditBio={setEditBio} setShowEditProfile={setShowEditProfile}
            leaderboard={leaderboard}
            ltcPrice={ltcPrice}
          />
        )}
      </div>

      <ToastContainer toasts={toasts} />

      {showProofModal && currentProofJob && (
        <ProofModal
          job={currentProofJob}
          proofHash={proofHash}
          onProofHashChange={setProofHash}
          onSubmit={submitProof}
          onClose={() => setShowProofModal(false)}
          loading={loading}
        />
      )}

      {showEditProfile && (
        <EditProfileModal
          editBio={editBio} setEditBio={setEditBio}
          editSkillInput={editSkillInput} setEditSkillInput={setEditSkillInput}
          skills={skills} setSkills={setSkills}
          onClose={() => setShowEditProfile(false)}
          onSave={() => { setBio(editBio); setShowEditProfile(false); if (address) saveProfile(address, editBio, skills, avatarUrl) }}
          account={account || address || ''}
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
            confirmSubmitProof
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
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
