import { useState, useEffect } from 'react'
import { fetchWorkerActivities } from './useMyJobs'
import type { WorkerEvent } from '../types'

const WORKER_KEY = 'zkcompute_workers'
const STREAK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function computeStreak(events: WorkerEvent[]): boolean[] {
  const activeDates = new Set(
    events
      .filter(e => e.status === 'paid' || e.status === 'completed')
      .map(e => new Date(e.time).toDateString())
  )

  return STREAK_DAYS.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return activeDates.has(d.toDateString())
  })
}

export function useActivityStreak(address: string | undefined): {
  streakDays: string[]
  streakActive: boolean[]
  activeStreakCount: number
  loading: boolean
} {
  const [streakActive, setStreakActive] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setStreakActive([])
      setLoading(false)
      return
    }

    const addr = address.toLowerCase()

    const events: WorkerEvent[] = JSON.parse(localStorage.getItem(WORKER_KEY) || '[]')
    const ownEvents = events.filter(e => e.worker === addr)
    setStreakActive(computeStreak(ownEvents))
    setLoading(false)

    fetchWorkerActivities(addr).then(remote => {
      if (remote.length > 0) {
        setStreakActive(computeStreak(remote))
      }
    }).catch(() => {})
  }, [address])

  const activeStreakCount = streakActive.filter(Boolean).length

  return { streakDays: STREAK_DAYS, streakActive, activeStreakCount, loading }
}
