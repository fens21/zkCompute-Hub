import { useCallback, useRef } from 'react'
import { readContract } from '@wagmi/core'
import { keccak256, encodePacked } from 'viem'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import type { ReputationSnapshot } from '../types'

export function useReputation() {
  const cacheRef = useRef<Map<string, ReputationSnapshot>>(new Map())

  const getReputation = useCallback(async (worker: string): Promise<ReputationSnapshot | null> => {
    const addr = worker.toLowerCase()
    const cached = cacheRef.current.get(addr)
    if (cached) return cached

    try {
      const result = await readContract(config, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'reputationSnapshots',
        args: [addr as `0x${string}`],
      }) as readonly [bigint, bigint, bigint, `0x${string}`, bigint]

      const snapshot: ReputationSnapshot = {
        worker: addr,
        jobsClaimed: Number(result[0]),
        jobsPaid: Number(result[1]),
        totalEarned: result[2].toString(),
        reputationHash: result[3],
        lastUpdated: Number(result[4]),
      }

      cacheRef.current.set(addr, snapshot)
      return snapshot
    } catch {
      return null
    }
  }, [])

  const getReputationsBatch = useCallback(async (workers: string[]): Promise<Map<string, ReputationSnapshot>> => {
    const unique = [...new Set(workers.map(w => w.toLowerCase()))]
    const result = new Map<string, ReputationSnapshot>()

    const snapshots = await Promise.allSettled(
      unique.map(addr =>
        readContract(config, {
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi,
          functionName: 'reputationSnapshots',
          args: [addr as `0x${string}`],
        }) as Promise<readonly [bigint, bigint, bigint, `0x${string}`, bigint]>
      )
    )

    snapshots.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        const d = res.value
        const addr = unique[i]
        const snapshot: ReputationSnapshot = {
          worker: addr,
          jobsClaimed: Number(d[0]),
          jobsPaid: Number(d[1]),
          totalEarned: d[2].toString(),
          reputationHash: d[3],
          lastUpdated: Number(d[4]),
        }
        cacheRef.current.set(addr, snapshot)
        result.set(addr, snapshot)
      }
    })

    return result
  }, [])

  const verifyReputationHash = useCallback((snapshot: ReputationSnapshot): boolean => {
    try {
      const computed = keccak256(
        encodePacked(
          ['address', 'uint256', 'uint256', 'uint256', 'uint256'],
          [snapshot.worker as `0x${string}`, BigInt(snapshot.jobsClaimed), BigInt(snapshot.jobsPaid), BigInt(snapshot.totalEarned), BigInt(snapshot.lastUpdated)]
        )
      )
      return computed === snapshot.reputationHash
    } catch {
      console.error('Failed to verify reputation hash')
      return false
    }
  }, [])

  return { getReputation, getReputationsBatch, verifyReputationHash }
}
