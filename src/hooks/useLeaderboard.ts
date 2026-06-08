import { useState, useCallback, useRef } from 'react'
import { readContract } from '@wagmi/core'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import { loadProfilesRemote } from './useWorkerProfiles'
import { useReputation } from './useReputation'
import type { LeaderboardEntry, Job } from '../types'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const CACHE_DURATION = 5 * 60 * 1000
const CACHE_STORAGE_KEY = 'zkcompute_leaderboard'
const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || ''

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY)
      if (cached) return JSON.parse(cached)
    } catch {}
    return []
  })
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef<{ data: LeaderboardEntry[]; time: number } | null>(null)
  const fetchingRef = useRef(false)
  const { getReputationsBatch } = useReputation()

  const fromSubgraph = useCallback(async (forceRefresh: boolean) => {
    if (!forceRefresh && cacheRef.current) {
      const age = Date.now() - cacheRef.current.time
      if (age < CACHE_DURATION) {
        setLeaderboard(cacheRef.current.data)
        return true
      }
    }
    if (fetchingRef.current) return true
    fetchingRef.current = true
    setLoading(true)

    try {
      const profiles = await loadProfilesRemote()
      const query = `{ workers(first: 100, orderBy: totalEarned, orderDirection: desc) { id jobsClaimed jobsPaid totalEarned } }`
      const res = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const json = await res.json()
      const workers: any[] = json?.data?.workers ?? []

      const entries: LeaderboardEntry[] = workers.map((w: any) => {
        const worker = w.id.startsWith('0x') ? w.id : '0x' + w.id
        const p = profiles[worker.toLowerCase()]
        const claimed = parseInt(w.jobsClaimed) || 0
        const paid = parseInt(w.jobsPaid) || 0
        const earned = Number(w.totalEarned || '0')
        return {
          worker,
          jobsClaimed: claimed,
          jobsPaid: paid,
          totalEarned: earned,
          earnedZkltc: earned,
          earnedUsdc: 0,
          points: claimed * 10 + paid * 25,
          bio: p?.bio,
          skills: p?.skills,
          avatarUrl: p?.avatarUrl,
        }
      })

      entries.sort((a, b) => b.points - a.points)
      cacheRef.current = { data: entries, time: Date.now() }
      setLeaderboard(entries)
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries))
      return true
    } catch {
      console.warn('Subgraph unavailable, falling back to on-chain')
      return false
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  const fromChain = useCallback(async (onChainJobs: Job[], forceRefresh: boolean) => {
    if (!forceRefresh && cacheRef.current) {
      const age = Date.now() - cacheRef.current.time
      if (age < CACHE_DURATION) {
        setLeaderboard(cacheRef.current.data)
        return
      }
    }
    if (fetchingRef.current) return
    fetchingRef.current = true
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

      const workerAddrs = [...chainMap.keys()]
      const onChainReps = await getReputationsBatch(workerAddrs)

      const merged = new Map<string, LeaderboardEntry>()
      for (const [worker, rec] of chainMap) {
        const p = profiles[worker]
        const onChain = onChainReps.get(worker)
        const jobsClaimed = (onChain && onChain.lastUpdated > 0) ? onChain.jobsClaimed : rec.claimed.size
        const jobsPaid = (onChain && onChain.lastUpdated > 0) ? onChain.jobsPaid : rec.paid.size
        const totalEarned = (onChain && onChain.lastUpdated > 0) ? Number(onChain.totalEarned) : rec.earnedZkltc + rec.earnedUsdc

        merged.set(worker, {
          worker,
          jobsClaimed,
          jobsPaid,
          totalEarned,
          earnedZkltc: rec.earnedZkltc,
          earnedUsdc: rec.earnedUsdc,
          points: jobsClaimed * 10 + jobsPaid * 25,
          bio: p?.bio,
          skills: p?.skills,
          avatarUrl: p?.avatarUrl,
        })
      }

      const sorted = [...merged.values()].sort((a, b) => b.points - a.points)
      cacheRef.current = { data: sorted, time: Date.now() }
      setLeaderboard(sorted)
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(sorted))
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e)
    }
    setLoading(false)
    fetchingRef.current = false
  }, [getReputationsBatch])

  const fetchLeaderboard = useCallback(async (onChainJobs: Job[], forceRefresh = false) => {
    if (SUBGRAPH_URL) {
      const ok = await fromSubgraph(forceRefresh)
      if (ok) return
    }
    await fromChain(onChainJobs, forceRefresh)
  }, [fromSubgraph, fromChain])

  return { leaderboard, loading, fetchLeaderboard }
}
