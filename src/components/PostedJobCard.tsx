import { useState, useEffect } from 'react'
import { readContract } from '@wagmi/core'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import type { Job } from '../types'
import { shorten } from '../utils'

export function PostedJobCard({ job, onRelease, onDeactivate, onDispute, loading }: { job: Job; onRelease: (worker: string, j: Job) => void; onDeactivate: (j: Job) => void; onDispute: (j: Job, worker?: string) => void; loading: boolean }) {
  const [claimantsList, setClaimantsList] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      const addrs: string[] = []
      for (let i = 0; i < job.claimedCount; i++) {
        if (cancelled) return
        try {
          const addr = await readContract(config, {
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi,
            functionName: 'claimants',
            args: [BigInt(job.id), BigInt(i)],
          }) as string
          if (addr && addr !== '0x0000000000000000000000000000000000000000') addrs.push(addr)
        } catch (e) {
          console.error(`Failed to fetch claimant ${i} for job ${job.id}:`, e)
        }
      }
      if (!cancelled) setClaimantsList(addrs)
    }
    fetch()
    return () => { cancelled = true }
  }, [job.id, job.claimedCount])

  return (
    <div style={{ background: '#111', border: '1px solid #ffd700', borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{job.title}</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Reward: {job.reward} {job.tokenSymbol || 'zkLTC'} / worker</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>Claimed: {job.claimedCount}/{job.maxWorkers}</div>
      {claimantsList.length > 0 ? (
        <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12 }}>
          <CheckProofs jobId={job.id} claimants={claimantsList} onRelease={onRelease} job={job} loading={loading} onDispute={onDispute} />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, opacity: 0.5 }}>
          <span>No workers claimed yet</span>
          <button
            onClick={() => onDeactivate(job)}
            style={{ background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            DEACTIVATE
          </button>
        </div>
      )}
    </div>
  )
}

function CheckProofs({ jobId, claimants, onRelease, job, loading, onDispute }: { jobId: number; claimants: string[]; onRelease: (worker: string, j: Job) => void; job: Job; loading: boolean; onDispute: (j: Job, worker: string) => void }) {
  const [workers, setWorkers] = useState<{ addr: string; hasProof: boolean; isPaid: boolean; isDisputed: boolean }[]>([])

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      const results: { addr: string; hasProof: boolean; isPaid: boolean; isDisputed: boolean }[] = []
      for (const addr of claimants) {
        if (cancelled) return
        try {
          const hasProof = await readContract(config, {
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi,
            functionName: 'proofSubmitted',
            args: [BigInt(jobId), addr as `0x${string}`],
          }) as boolean
          const isPaid = hasProof ? await readContract(config, {
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi,
            functionName: 'paid',
            args: [BigInt(jobId), addr as `0x${string}`],
          }) as boolean : false
          const isDisputed = await readContract(config, {
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi,
            functionName: 'disputed',
            args: [BigInt(jobId), addr as `0x${string}`],
          }) as boolean
          results.push({ addr, hasProof, isPaid, isDisputed })
        } catch (e) {
          console.error(`Failed to check proof for worker ${addr} on job ${jobId}:`, e)
          results.push({ addr, hasProof: false, isPaid: false, isDisputed: false })
        }
      }
      if (!cancelled) setWorkers(results)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [jobId, claimants])

  const pending = workers.filter(w => w.hasProof && !w.isPaid)
  const paidList = workers.filter(w => w.isPaid)
  const claimed = workers.filter(w => !w.hasProof && !w.isPaid)

  return (
    <div style={{ fontSize: 12 }}>
      {pending.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>Proof Pending ({pending.length})</div>
          {pending.map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < pending.length - 1 ? '1px solid #222' : 'none', gap: 4 }}>
              <span style={{ fontFamily: 'monospace', flex: 1 }}>{shorten(w.addr)}{w.isDisputed && <span style={{ color: '#f97316', fontWeight: 600 }}> (Disputed)</span>}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => onRelease(w.addr, job)}
                  disabled={loading}
                  style={{ background: '#4ade80', color: '#000', border: 'none', padding: '4px 8px', fontWeight: 700, borderRadius: 4, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>
                  RELEASE
                </button>
                <button
                  onClick={() => onDispute(job, w.addr)}
                  style={{ background: 'transparent', color: '#f97316', border: '1px solid #f97316', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  DISPUTE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {paidList.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ color: '#888', fontWeight: 600, marginBottom: 2 }}>Paid ({paidList.length})</div>
          {paidList.map((w, i) => (
            <div key={i} style={{ opacity: 0.6, padding: '2px 0' }}>
              {shorten(w.addr)} — paid
            </div>
          ))}
        </div>
      )}
      {claimed.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ color: '#888', fontWeight: 600, marginBottom: 4 }}>Claimed ({claimed.length})</div>
          {claimed.map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < claimed.length - 1 ? '1px solid #222' : 'none' }}>
              <span style={{ fontFamily: 'monospace', opacity: 0.7 }}>{shorten(w.addr)}{w.isDisputed ? <span style={{ color: '#f97316', fontWeight: 600, marginLeft: 6 }}>(Disputed)</span> : ''}</span>
              <button
                onClick={() => onDispute(job, w.addr)}
                style={{ background: 'transparent', color: '#f97316', border: '1px solid #f97316', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                DISPUTE
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
