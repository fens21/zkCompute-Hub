import { useState, useEffect, useCallback } from 'react'
import { readContract } from '@wagmi/core'
import { formatUnits } from 'viem'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import type { Job } from '../types'
import { fetchJobMetadata } from './useJobMetadata'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function parseJob(raw: [bigint, string, string, bigint, string, string, bigint, bigint, boolean]): Job {
  const tokenAddr = (raw[4] as string).toLowerCase()
  const isNative = tokenAddr === ZERO_ADDRESS.toLowerCase()
  const decimals = isNative ? 18 : 6
  const rewardNum = Number(formatUnits(raw[3], decimals))
  const tokenSymbol = isNative ? 'zkLTC' : 'USDC'
  const difficulty = rewardNum >= 150 ? 'Expert' : rewardNum >= 80 ? 'Hard' : 'Medium'
  return {
    id: Number(raw[0]),
    title: raw[1],
    type: raw[2],
    reward: rewardNum,
    deadline: '',
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
    return {
      ...j,
      title: meta.title ?? j.title,
      type: meta.type ?? j.type,
      description: meta.description,
      requirements: meta.requirements,
      deadline: meta.deadline,
      difficulty: meta.difficulty || j.difficulty,
      parameters: meta.parameters || j.parameters,
      inputData: meta.input_data || j.inputData,
      expectedOutput: meta.expected_output || j.expectedOutput,
      verificationMethod: meta.verification_method || j.verificationMethod,
    }
  })
}

const BATCH_SIZE = 10

async function fetchJobsBatch(ids: number[]): Promise<Job[]> {
  const results = await Promise.allSettled(
    ids.map(i =>
      readContract(config, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'jobs',
        args: [BigInt(i)],
      }) as Promise<[bigint, string, string, bigint, string, string, bigint, bigint, boolean]>
    )
  )

  const jobs: Job[] = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value[8]) {
      jobs.push(parseJob(result.value))
    }
  }
  return jobs
}

export function useJobs(autoFetch: boolean) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [onChainJobs, setOnChainJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOnChainJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const count = await readContract(config, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'jobCount',
      }) as bigint

      const total = Number(count)
      const ids = Array.from({ length: total }, (_, i) => i + 1)

      const onChain: Job[] = []
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE)
        const batchJobs = await fetchJobsBatch(batch)
        onChain.push(...batchJobs)
      }

      let metaMap = new Map<number, import('./useJobMetadata').JobMetadata>()
      try {
        const idList = onChain.map(j => j.id)
        metaMap = await fetchJobMetadata(idList)
      } catch { /* table may not exist yet */ }

      const merged = mergeMetadata(onChain, metaMap)

      setOnChainJobs(merged)
      setJobs(merged)
    } catch (e) {
      console.error('Failed to fetch on-chain jobs:', e)
      setError('Failed to load jobs. Please check your wallet connection.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchOnChainJobs()
    }
  }, [autoFetch, fetchOnChainJobs])

  return { jobs, setJobs, onChainJobs, loading, error, refetch: fetchOnChainJobs }
}
