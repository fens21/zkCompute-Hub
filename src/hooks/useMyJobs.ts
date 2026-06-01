import { useState, useEffect, useCallback, useRef } from 'react'
import type { Job, WorkerEvent } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const MYJOBS_KEY = 'zkcompute_myjobs_v2'
const WORKER_KEY = 'zkcompute_workers'

// Supabase proxy base URL (server side)
const PROXY_BASE = '/api'

function loadMyJobs(address?: string): Job[] {
  if (!address) return []
  const addr = address.toLowerCase()
  try {
    const saved = localStorage.getItem(MYJOBS_KEY)
    if (!saved) return []
    const data = JSON.parse(saved)
    if (Array.isArray(data)) return data
    return data[addr] || []
  } catch {
    return []
  }
}

function saveMyJobs(address: string, jobs: Job[]) {
  try {
    const addr = address.toLowerCase()
    const raw = localStorage.getItem(MYJOBS_KEY)
    const currentData: Record<string, Job[]> = (() => {
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? {} : parsed
    })()
    currentData[addr] = jobs
    localStorage.setItem(MYJOBS_KEY, JSON.stringify(currentData))
  } catch (e) {
    console.error('saveMyJobs error:', e)
  }
}

async function saveActivityToSupabase(status: string, job: Job, workerAddr: string, proofUrl?: string, proofHash?: string) {
  try {
    const res = await fetch(`${PROXY_BASE}/activities`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        worker: workerAddr.toLowerCase(),
        job_id: job.id,
        job_title: job.title,
        reward: job.reward,
        token_symbol: job.tokenSymbol || 'zkLTC',
        status,
        proof_url: proofUrl || '',
        proof_hash: proofHash || '',
        created_at: Date.now(),
        job_data: JSON.stringify(job),
      }),
    })
    if (!res.ok) console.error('saveActivityToSupabase failed:', await res.text())
  } catch (e) {
    console.error('Failed to save activity to Supabase:', e)
  }
}

export async function fetchWorkerActivities(workerAddr: string): Promise<(WorkerEvent & { job?: Job })[]> {
  try {
    const res = await fetch(
      `${PROXY_BASE}/activities?worker=eq.${workerAddr.toLowerCase()}&order=created_at.desc&limit=50&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((row: {
      worker: string; job_id: number; job_title: string
      reward: number; token_symbol: string
      status: 'claimed' | 'completed' | 'paid'; created_at: number; proof_url?: string | null
      job_data?: string | null
    }) => {
      let job: Job | undefined
      if (row.job_data) {
        try { job = JSON.parse(row.job_data) } catch { /* ignore */ }
      }
      return {
        worker: row.worker,
        jobId: row.job_id,
        title: row.job_title,
        reward: row.reward,
        tokenSymbol: row.token_symbol,
        status: row.status,
        time: row.created_at,
        ...(row.proof_url ? { proofUrl: row.proof_url } : {}),
        ...(job ? { job } : {}),
      }
    })
  } catch {
    return []
  }
}

export async function fetchProofUrl(jobId: number, workerAddr: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/activities?job_id=eq.${jobId}&worker=eq.${workerAddr.toLowerCase()}&status=eq.completed&select=proof_url&order=created_at.desc&limit=1`,
      { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0 && data[0].proof_url) {
      return data[0].proof_url
    }
    return null
  } catch {
    return null
  }
}

export async function fetchProofHash(jobId: number, workerAddr: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/activities?job_id=eq.${jobId}&worker=eq.${workerAddr.toLowerCase()}&status=eq.completed&select=proof_hash&order=created_at.desc&limit=1`,
      { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0 && data[0].proof_hash) {
      return data[0].proof_hash
    }
    return null
  } catch {
    return null
  }
}

export function saveWorkerEvent(status: 'claimed' | 'completed' | 'paid', job: Job, workerAddr?: string, proofUrl?: string, proofHash?: string) {
  if (!workerAddr) return
  const events: WorkerEvent[] = JSON.parse(localStorage.getItem(WORKER_KEY) || '[]')
  events.push({
    worker: workerAddr.toLowerCase(),
    jobId: job.id,
    title: job.title,
    reward: job.reward,
    tokenSymbol: job.tokenSymbol || 'zkLTC',
    status,
    time: Date.now(),
    ...(proofUrl ? { proofUrl } : {}),
  })
  localStorage.setItem(WORKER_KEY, JSON.stringify(events))
  saveActivityToSupabase(status, job, workerAddr, proofUrl, proofHash)
}

export function getLeaderboardLocal() {
  const events: WorkerEvent[] = JSON.parse(localStorage.getItem(WORKER_KEY) || '[]')
  const map = new Map<string, {
    jobsClaimed: Set<number>; jobsPaid: Set<number>
    earnedZkltc: number; earnedUsdc: number
  }>()
  for (const e of events) {
    if (!map.has(e.worker)) map.set(e.worker, { jobsClaimed: new Set(), jobsPaid: new Set(), earnedZkltc: 0, earnedUsdc: 0 })
    const rec = map.get(e.worker)!
    if (e.status === 'claimed' || e.status === 'completed') rec.jobsClaimed.add(e.jobId)
    if (e.status === 'paid') {
      rec.jobsPaid.add(e.jobId)
      if (e.tokenSymbol === 'USDC') rec.earnedUsdc += e.reward
      else rec.earnedZkltc += e.reward
    }
  }
  return [...map.entries()]
    .map(([worker, rec]) => ({
      worker,
      jobsClaimed: rec.jobsClaimed.size,
      jobsPaid: rec.jobsPaid.size,
      totalEarned: rec.earnedZkltc + rec.earnedUsdc,
      earnedZkltc: rec.earnedZkltc,
      earnedUsdc: rec.earnedUsdc,
      points: rec.jobsClaimed.size * 10 + rec.jobsPaid.size * 25,
    }))
    .sort((a, b) => b.points - a.points)
}

export function useMyJobs(address: string | undefined, _syncEnabled: boolean = true) {
  void _syncEnabled
  const [myJobs, setMyJobsState] = useState<Job[]>([])
  const loadedRef = useRef(false)
  const addressRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!address) {
      setMyJobsState([])
      loadedRef.current = false
      addressRef.current = undefined
      return
    }
    const cached = loadMyJobs(address)
    if (cached.length > 0) {
      setMyJobsState(cached)
      loadedRef.current = true
      addressRef.current = address.toLowerCase()
      return
    }
    // No cache — restore from Supabase
    addressRef.current = address.toLowerCase()
    fetchWorkerActivities(address).then(events => {
      const jobsMap = new Map<number, Job>()
      for (const ev of events) {
        const existing = jobsMap.get(ev.jobId)
        if (!existing || ev.job) {
          if (ev.job) {
            jobsMap.set(ev.jobId, { ...ev.job, status: ev.status })
          } else {
            jobsMap.set(ev.jobId, {
              id: ev.jobId,
              title: ev.title,
              type: 'Custom',
              reward: ev.reward,
              deadline: '',
              description: '',
              requirements: '',
              poster: '',
              claimedCount: 1,
              maxWorkers: 1,
              difficulty: 'Medium',
              tokenSymbol: ev.tokenSymbol,
              status: ev.status,
              createdAt: ev.time,
              claimedBy: address?.toLowerCase(),
            })
          }
        } else if (ev.status === 'paid' || (ev.status === 'completed' && existing.status !== 'paid')) {
          jobsMap.set(ev.jobId, { ...existing, status: ev.status })
        }
      }
      const restored = [...jobsMap.values()]
      setMyJobsState(restored)
      loadedRef.current = true
      if (restored.length > 0) saveMyJobs(address, restored)
    }).catch(() => {
      loadedRef.current = true
    })
  }, [address])

  const setMyJobs = useCallback((updater: Job[] | ((prev: Job[]) => Job[])) => {
    if (!address) return
    setMyJobsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (loadedRef.current) {
        saveMyJobs(address, next)
      }
      return next
    })
  }, [address])

  return { myJobs, setMyJobs }
}