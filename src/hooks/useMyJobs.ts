import { useState, useEffect, useCallback, useRef } from 'react'
import type { Job, WorkerEvent } from '../types'

const MYJOBS_KEY = 'zkcompute_myjobs_v2'
const WORKER_KEY = 'zkcompute_workers'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function loadMyJobs(address?: string): Job[] {
  if (!address) return []
  const addr = address.toLowerCase()
  try {
    const saved = localStorage.getItem(MYJOBS_KEY)
    if (!saved) return []
    const data = JSON.parse(saved)
    if (Array.isArray(data)) return []
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

// ── Supabase activity sync ────────────────────────────────────────────────
async function saveActivityToSupabase(status: string, job: Job, workerAddr: string) {
  try {
    // Check if activity already exists for this job
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/activities?worker=eq.${workerAddr.toLowerCase()}&job_id=eq.${job.id}&select=id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const existing = await checkRes.json()

    if (Array.isArray(existing) && existing.length > 0) {
      // Update existing status
      await fetch(
        `${SUPABASE_URL}/rest/v1/activities?worker=eq.${workerAddr.toLowerCase()}&job_id=eq.${job.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, created_at: Date.now() }),
        }
      )
    } else {
      // Insert new record
      await fetch(`${SUPABASE_URL}/rest/v1/activities`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker: workerAddr.toLowerCase(),
          job_id: job.id,
          job_title: job.title,
          reward: job.reward,
          token_symbol: job.tokenSymbol || 'zkLTC',
          status,
          created_at: Date.now(),
        }),
      })
    }
  } catch (e) {
    console.error('Failed to save activity to Supabase:', e)
  }
}

export async function fetchWorkerActivities(workerAddr: string): Promise<WorkerEvent[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/activities?worker=eq.${workerAddr.toLowerCase()}&order=created_at.desc&limit=10&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((row: { worker: string; job_id: number; job_title: string; reward: number; token_symbol: string; status: 'claimed' | 'completed' | 'paid'; created_at: number }) => ({
      worker: row.worker,
      jobId: row.job_id,
      title: row.job_title,
      reward: row.reward,
      tokenSymbol: row.token_symbol,
      status: row.status,
      time: row.created_at,
    }))
  } catch {
    return []
  }
}

export function saveWorkerEvent(status: 'claimed' | 'completed' | 'paid', job: Job, workerAddr?: string) {
  if (!workerAddr) return
  // Save locally
  const events: WorkerEvent[] = JSON.parse(localStorage.getItem(WORKER_KEY) || '[]')
  events.push({
    worker: workerAddr.toLowerCase(),
    jobId: job.id,
    title: job.title,
    reward: job.reward,
    tokenSymbol: job.tokenSymbol || 'zkLTC',
    status,
    time: Date.now()
  })
  localStorage.setItem(WORKER_KEY, JSON.stringify(events))
  // Save to Supabase (background)
  saveActivityToSupabase(status, job, workerAddr)
}

export function getLeaderboardLocal() {
  const events: WorkerEvent[] = JSON.parse(localStorage.getItem(WORKER_KEY) || '[]')
  const map = new Map<string, { jobsClaimed: Set<number>; jobsPaid: Set<number>; earnedZkltc: number; earnedUsdc: number }>()
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
    // Load from localStorage
    const cached = loadMyJobs(address)
    setMyJobsState(cached)
    loadedRef.current = true
    addressRef.current = address.toLowerCase()
  }, [address])

  // Note: watchContractEvent watchers removed — they used empty onLogs handlers
  // which wasted RPC resources. Event-driven UI updates can be re-added later
  // with meaningful handlers if needed.

  // setMyJobs — immediately persist to localStorage
  const setMyJobs = useCallback((updater: Job[] | ((prev: Job[]) => Job[])) => {
    if (!address) return
    setMyJobsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Persist immediately instead of in a useEffect
      if (loadedRef.current) {
        saveMyJobs(address, next)
      }
      return next
    })
  }, [address])

  return { myJobs, setMyJobs }
}
