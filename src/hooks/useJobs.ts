import { useState, useEffect, useCallback, useRef } from 'react'
import { readContract } from '@wagmi/core'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import type { Job } from '../types'
import { fetchJobMetadata } from './useJobMetadata'

// Demo jobs removed for clean testing. Marketplace will only show on-chain jobs.
const DEMO_JOBS: Job[] = []

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function parseJob(raw: [bigint, string, string, bigint, string, string, bigint, bigint, boolean]): Job {
  const tokenAddr = (raw[4] as string).toLowerCase()
  const isNative = tokenAddr === ZERO_ADDRESS.toLowerCase()
  const decimals = isNative ? 18 : 6
  const rewardNum = Number(raw[3]) / 10 ** decimals
  const tokenSymbol = isNative ? 'zkLTC' : 'USDC'
  const difficulty = rewardNum >= 150 ? 'Expert' : rewardNum >= 80 ? 'Hard' : 'Medium'
  return {
    id: Number(raw[0]),
    title: raw[1],
    type: raw[2],
    reward: rewardNum,
    deadline: 'N/A',
    description: `${raw[2]} job — ${rewardNum} ${tokenSymbol} reward`,
    requirements: `Posted by ${(raw[5] as string).slice(0, 6)}...`,
    poster: raw[5] as string,
    claimedCount: Number(raw[7]),
    maxWorkers: Number(raw[6]),
    difficulty,
    tokenSymbol,
  }
}

function mergeMetadata(jobs: Job[], metaMap: Map<number, import('./useJobMetadata').JobMetadata>): Job[] {
  return jobs.map(j => {
    const meta = metaMap.get(j.id)
    if (!meta) return j
    return { ...j, title: meta.title ?? j.title, type: meta.type ?? j.type, description: meta.description, requirements: meta.requirements, deadline: meta.deadline, difficulty: meta.difficulty || j.difficulty }
  })
}

export function useJobs(autoFetch: boolean) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [onChainJobs, setOnChainJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const fetchOnChainJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    hasFetched.current = true
    try {
      const count = await readContract(config, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'jobCount',
      }) as bigint

      const onChain: Job[] = []
      for (let i = 1; i <= Number(count); i++) {
        try {
          const job = await readContract(config, {
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi,
            functionName: 'jobs',
            args: [BigInt(i)],
          }) as [bigint, string, string, bigint, string, string, bigint, bigint, boolean]

          if (job[8]) {
            onChain.push(parseJob(job))
          }
        } catch (e) {
          console.error(`Failed to fetch on-chain job #${i}:`, e)
        }
      }
      let metaMap = new Map<number, import('./useJobMetadata').JobMetadata>()
      try {
        const idList = onChain.map(j => j.id)
        metaMap = await fetchJobMetadata(idList)
      } catch { /* table may not exist yet */ }
      setOnChainJobs(mergeMetadata(onChain, metaMap))
      setJobs(mergeMetadata([...onChain, ...DEMO_JOBS], metaMap))
    } catch (e) {
      console.error('Failed to fetch on-chain jobs:', e)
      setError('Failed to load jobs. Please check your wallet connection.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (autoFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOnChainJobs()
    }
  }, [autoFetch, fetchOnChainJobs])

  return { jobs, setJobs, onChainJobs, loading, error, refetch: fetchOnChainJobs }
}
