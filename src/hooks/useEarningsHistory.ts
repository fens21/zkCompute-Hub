import { useState, useEffect } from 'react'
import { fetchWorkerActivities } from './useMyJobs'
import type { WorkerEvent } from '../types'

const WORKER_KEY = 'zkcompute_workers'

function getWeekBoundaries(): { start: number; end: number; label: string }[] {
  const now = Date.now()
  const weeks: { start: number; end: number; label: string }[] = []
  for (let i = 3; i >= 0; i--) {
    const end = now - i * 7 * 24 * 60 * 60 * 1000
    const start = end - 7 * 24 * 60 * 60 * 1000
    const label = i === 0 ? 'This week' : i === 1 ? 'Last week' : `${i}w ago`
    weeks.push({ start, end, label })
  }
  return weeks
}

function computeWeeklyEarnings(events: WorkerEvent[]): { label: string; amount: number }[] {
  const weeks = getWeekBoundaries()
  return weeks.map(w => {
    const amount = events
      .filter(e => e.status === 'paid' && e.time >= w.start && e.time < w.end)
      .reduce((sum, e) => sum + e.reward, 0)
    return { label: w.label, amount }
  })
}

export function useEarningsHistory(address: string | undefined): {
  weeklyEarnings: { label: string; amount: number }[]
  loading: boolean
} {
  const [weeklyEarnings, setWeeklyEarnings] = useState<{ label: string; amount: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setWeeklyEarnings([])
      setLoading(false)
      return
    }

    const addr = address.toLowerCase()

    const events: WorkerEvent[] = JSON.parse(localStorage.getItem(WORKER_KEY) || '[]')
    const ownEvents = events.filter(e => e.worker === addr)
    setWeeklyEarnings(computeWeeklyEarnings(ownEvents))
    setLoading(false)

    fetchWorkerActivities(addr).then(remote => {
      if (remote.length > 0) {
        const merged = computeWeeklyEarnings(remote)
        setWeeklyEarnings(merged)
      }
    }).catch(() => {})
  }, [address])

  return { weeklyEarnings, loading }
}
