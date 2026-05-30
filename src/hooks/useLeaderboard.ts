import { useState, useCallback, useRef } from 'react'
import { readContract } from '@wagmi/core'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import { loadProfilesRemote } from './useWorkerProfiles'
import type { LeaderboardEntry, Job } from '../types'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const CACHE_DURATION = 60 * 1000

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef<{ data: LeaderboardEntry[]; time: number } | null>(null)

  const fetchLeaderboard = useCallback(async (onChainJobs: Job[], forceRefresh = false) => {
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
      const chainMap = new Map<string, {
        claimed: Set<number>
        paid: Set<number>
        earnedZkltc: number
        earnedUsdc: number
      }>()

      await Promise.allSettled(
        onChainJobs
          .filter(job => job.claimedCount > 0)
          .map(async job => {
            const jobId = BigInt(job.id)
            const isUsdc = job.tokenSymbol === 'USDC'

            const claimantResults = await Promise.allSettled(
              Array.from({ length: job.claimedCount }, (_, idx) =>
                readContract(config, {
                  address: CONTRACT_ADDRESS as `0x${string}`,
                  abi,
                  functionName: 'claimants',
                  args: [jobId, BigInt(idx)],
                }) as Promise<string>
              )
            )

            const claimants = claimantResults
              .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
              .map(r => r.value)
              .filter(c => c && c !== ZERO_ADDRESS)

            const paidResults = await Promise.allSettled(
              claimants.map(claimant =>
                readContract(config, {
                  address: CONTRACT_ADDRESS as `0x${string}`,
                  abi,
                  functionName: 'paid',
                  args: [jobId, claimant as `0x${string}`],
                }) as Promise<boolean>
              )
            )

            claimants.forEach((claimant, i) => {
              const w = claimant.toLowerCase()
              if (!chainMap.has(w)) {
                chainMap.set(w, { claimed: new Set(), paid: new Set(), earnedZkltc: 0, earnedUsdc: 0 })
              }
              const rec = chainMap.get(w)!

              if (!rec.claimed.has(job.id)) {
                rec.claimed.add(job.id)

                const paidResult = paidResults[i]
                if (paidResult.status === 'fulfilled' && paidResult.value) {
                  rec.paid.add(job.id)
                  if (isUsdc) rec.earnedUsdc += job.reward
                  else rec.earnedZkltc += job.reward
                }
              }
            })
          })
      )

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
          avatarUrl: p?.avatarUrl,
        })
      }

      const sorted = [...merged.values()].sort((a, b) => b.points - a.points)
      cacheRef.current = { data: sorted, time: Date.now() }
      setLeaderboard(sorted)
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e)
    }
    setLoading(false)
  }, [])

  return { leaderboard, loading, fetchLeaderboard }
}
