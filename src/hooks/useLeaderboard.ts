import { useState, useCallback, useRef } from 'react'
import { readContract } from '@wagmi/core'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import { loadProfilesRemote } from './useWorkerProfiles'
import type { LeaderboardEntry, Job } from '../types'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const CACHE_DURATION = 60 * 1000 // 1 menit

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef<{ data: LeaderboardEntry[]; time: number } | null>(null)

  const fetchLeaderboard = useCallback(async (onChainJobs: Job[], forceRefresh = false) => {
    // Kalau cache masih fresh dan tidak force refresh, pakai cache
    if (!forceRefresh && cacheRef.current) {
      const age = Date.now() - cacheRef.current.time
      if (age < CACHE_DURATION) {
        setLeaderboard(cacheRef.current.data)
        return
      }
    }
    setLoading(true)
    try {
      const profiles = await loadProfilesRemote()

      const chainMap = new Map<string, { claimed: Set<number>; paid: Set<number>; earnedZkltc: number; earnedUsdc: number }>()

      for (const job of onChainJobs) {
        if (job.claimedCount <= 0) continue
        const jobId = BigInt(job.id)
        const isUsdc = job.tokenSymbol === 'USDC'

        for (let idx = 0; idx < job.claimedCount; idx++) {
          try {
            const claimant = await readContract(config, {
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi,
              functionName: 'claimants',
              args: [jobId, BigInt(idx)],
            }) as string
            if (!claimant || claimant === ZERO_ADDRESS) continue

            const w = claimant.toLowerCase()
            if (!chainMap.has(w)) chainMap.set(w, { claimed: new Set(), paid: new Set(), earnedZkltc: 0, earnedUsdc: 0 })
            const rec = chainMap.get(w)!

            if (!rec.claimed.has(job.id)) {
              rec.claimed.add(job.id)

              const isPaid = await readContract(config, {
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi,
                functionName: 'paid',
                args: [jobId, claimant as `0x${string}`],
              }) as boolean

              if (isPaid) {
                rec.paid.add(job.id)
                if (isUsdc) rec.earnedUsdc += job.reward
                else rec.earnedZkltc += job.reward
              }
            }
          } catch (e) {
            console.error(`Failed to fetch claimant ${idx} for job ${job.id}:`, e)
          }
        }
      }

      const merged = new Map<string, LeaderboardEntry>()

      for (const [worker, rec] of chainMap) {
        const p = profiles[worker]
        merged.set(worker, {
          worker,
          jobsClaimed: rec.claimed.size,
          jobsPaid: rec.paid.size,
          totalEarned: rec.earnedZkltc + rec.earnedUsdc,
          earnedZkltc: rec.earnedZkltc,
          earnedUsdc: rec.earnedUsdc,
          points: rec.claimed.size * 10 + rec.paid.size * 25,
          bio: p?.bio,
          skills: p?.skills,
        })
      }

      const sorted = [...merged.values()].sort((a, b) => b.points - a.points)
      
      // Simpan ke cache
      cacheRef.current = { data: sorted, time: Date.now() }
      setLeaderboard(sorted)
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e)
    }
    setLoading(false)
  }, [])

  return { leaderboard, loading, fetchLeaderboard }
}
