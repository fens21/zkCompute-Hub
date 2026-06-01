import { useState, useEffect } from 'react'
import { readContract } from '@wagmi/core'
import abi from '../abi/JobMarketplace.json'
import { config, CONTRACT_ADDRESS } from '../config/chain'
import type { Job } from '../types'
import { shorten, formatDeadlineDate, getDeadlineMs } from '../utils'
import { colors, radii } from '../styles/tokens'
import { getProofUrl, discoverProofUrl } from '../hooks/useWorkerProfiles'
import { fetchProofUrl, fetchProofHash } from '../hooks/useMyJobs'

export function PostedJobCard({ job, onRelease, onDeactivate, onDispute, loading, deactivating, onEdit, view = 'grid', myAddress }: { job: Job; onRelease: (worker: string, j: Job) => void; onDeactivate: (j: Job) => void; onDispute: (j: Job, worker?: string) => void; loading: boolean; deactivating?: boolean; onEdit?: (j: Job) => void; view?: 'grid' | 'list'; myAddress?: string }) {
  const [claimantsList, setClaimantsList] = useState<string[]>([])
  const [claimantsLoading, setClaimantsLoading] = useState(true)
  const [claimantsRefreshKey, setClaimantsRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      setClaimantsLoading(true)
      const promises = Array.from({ length: job.claimedCount }, (_, i) =>
        readContract(config, {
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi,
          functionName: 'claimants',
          args: [BigInt(job.id), BigInt(i)],
        }).catch(() => '') as Promise<string>
      )
      const results = await Promise.all(promises)
      if (cancelled) return
      const addrs = results.filter(a => a && a !== '0x0000000000000000000000000000000000000000')
      setClaimantsList(addrs)
      setClaimantsLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [job.id, job.claimedCount, claimantsRefreshKey])

  const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2 })
  const isExpired = job.createdAt ? (getDeadlineMs(job.createdAt, job.deadline) ?? Infinity) <= Date.now() : false
  const sep = <div style={{ width: 1, height: 22, background: colors.border, flexShrink: 0 }} />
  const refreshClaimants = () => setClaimantsRefreshKey(k => k + 1)

  const [listOpen, setListOpen] = useState(false)

  return (
    <>
      {view === 'list' ? (
    <>
      <div onClick={() => claimantsList.length > 0 && setListOpen(!listOpen)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); claimantsList.length > 0 && setListOpen(!listOpen) } }} aria-expanded={claimantsList.length > 0 ? listOpen : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, padding: '10px 16px', cursor: claimantsList.length > 0 ? 'pointer' : 'default' }}>
        <span style={{ color: colors.textMuted, fontSize: 10, width: 16, flexShrink: 0, textAlign: 'center' }}>
          {claimantsList.length > 0 ? (listOpen ? '▼' : '▶') : ''}
        </span>
        <div style={{ fontWeight: 700, flex: '1 1 140px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: isExpired ? 0.5 : 1 }}>{job.title}{isExpired ? ' (expired)' : ''}</div>
        <div style={{ flex: '0 0 100px', fontSize: 10, color: colors.gold, background: isExpired ? '#333' : colors.borderLight, padding: '2px 6px', borderRadius: radii.full, textAlign: 'center', opacity: isExpired ? 0.6 : 1 }}>{isExpired ? 'EXPIRED' : job.type}</div>
        {sep}
        <div style={{ flex: '0 0 100px', whiteSpace: 'nowrap', color: colors.gold, fontWeight: 600 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
        {sep}
        <div style={{ flex: '0 0 70px', opacity: 0.6 }}>{job.claimedCount}/{job.maxWorkers} claimed</div>
        {sep}
        <div style={{ flex: '0 0 140px', opacity: 0.5, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDeadlineDate(job.createdAt, job.deadline)}</div>
        {sep}
        <div style={{ flex: '1 1 100px', minWidth: 0, display: 'flex', gap: 4, overflow: 'hidden' }}>
          {claimantsLoading ? (
            <span style={{ opacity: 0.4 }}>Loading...</span>
          ) : claimantsList.length > 0 ? (
            <span style={{ opacity: 0.4, fontSize: 10 }}>{claimantsList.length} worker{claimantsList.length > 1 ? 's' : ''}</span>
          ) : (
            <span style={{ opacity: 0.4 }}>No workers</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {onEdit && <button type="button" onClick={() => onEdit(job)} aria-label={`Edit job: ${job.title}`} style={{ background: 'transparent', color: colors.gold, border: `1px solid ${colors.gold}`, padding: '3px 10px', borderRadius: radii.sm, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>EDIT</button>}
          <button type="button" onClick={() => onDeactivate(job)} disabled={deactivating} aria-label={`Cancel and refund job: ${job.title}`} style={{ background: colors.red, color: '#000', border: 'none', padding: '4px 10px', borderRadius: radii.sm, cursor: deactivating ? 'not-allowed' : 'pointer', fontSize: 10, fontWeight: 700, opacity: deactivating ? 0.5 : 1 }}>{deactivating ? 'CANCELLING...' : 'CANCEL & REFUND'}</button>
        </div>
      </div>
      {listOpen && claimantsList.length > 0 && !claimantsLoading && (
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '8px 16px 12px', background: colors.bgElevated }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <button type="button" onClick={refreshClaimants} aria-label="Refresh claimants" style={{ background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, padding: '2px 8px', borderRadius: radii.sm, cursor: 'pointer', fontSize: 10 }}>↻ Refresh</button>
          </div>
          <CheckProofs jobId={job.id} claimants={claimantsList} claimantsRefreshKey={claimantsRefreshKey} onRelease={onRelease} job={job} loading={loading} onDispute={onDispute} myAddress={myAddress} />
        </div>
      )}
    </>
  ) : (
    <div className="job-card" style={{ background: colors.bgCard, border: `1px solid ${isExpired ? colors.red : colors.gold}`, borderRadius: radii.xl, padding: 24, opacity: isExpired ? 0.65 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{job.title}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isExpired && <span style={{ background: '#555', color: '#aaa', padding: '2px 10px', borderRadius: radii.full, fontSize: 10, fontWeight: 600 }}>EXPIRED</span>}
          <div style={{ background: colors.borderLight, color: colors.gold, padding: '2px 10px', borderRadius: radii.full, fontSize: 10, fontWeight: 600 }}>{job.type}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Reward: {rewardStr} {job.tokenSymbol || 'zkLTC'} / worker</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>Claimed: {job.claimedCount}/{job.maxWorkers}</div>
      <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>Escrowed: {(job.reward * job.maxWorkers).toLocaleString(undefined, { minimumFractionDigits: 2 })} {job.tokenSymbol || 'zkLTC'}</div>
      <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>Deadline: {formatDeadlineDate(job.createdAt, job.deadline)}</div>
      {claimantsLoading ? (
        <div style={{ fontSize: 11, opacity: 0.5, padding: '8px 0', textAlign: 'center' }}>Loading claimants...</div>
      ) : claimantsList.length > 0 ? (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <button type="button" onClick={refreshClaimants} aria-label="Refresh claimants" style={{ background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, padding: '2px 8px', borderRadius: radii.sm, cursor: 'pointer', fontSize: 10 }}>↻ Refresh</button>
          </div>
          <CheckProofs jobId={job.id} claimants={claimantsList} claimantsRefreshKey={claimantsRefreshKey} onRelease={onRelease} job={job} loading={loading} onDispute={onDispute} myAddress={myAddress} />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, gap: 6 }}>
          <span style={{ opacity: 0.5 }}>No workers claimed yet</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {onEdit && <button type="button" onClick={() => onEdit(job)} aria-label={`Edit job: ${job.title}`} style={{ background: 'transparent', color: colors.gold, border: `1px solid ${colors.gold}`, padding: '4px 12px', borderRadius: radii.sm, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>EDIT</button>}
            <button type="button" onClick={() => onDeactivate(job)} disabled={deactivating} aria-label={`Cancel and refund job: ${job.title}`} style={{ background: colors.red, color: '#000', border: 'none', padding: '6px 14px', borderRadius: radii.sm, cursor: deactivating ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, opacity: deactivating ? 0.5 : 1 }}>{deactivating ? 'CANCELLING...' : 'CANCEL & REFUND'}</button>
          </div>
        </div>
      )}
    </div>
  )}
</>
)
}

function CheckProofs({ jobId, claimants, claimantsRefreshKey, onRelease, job, loading, onDispute, myAddress }: { jobId: number; claimants: string[]; claimantsRefreshKey: number; onRelease: (worker: string, j: Job) => void; job: Job; loading: boolean; onDispute: (j: Job, worker: string) => void; myAddress?: string }) {
  const [workers, setWorkers] = useState<{ addr: string; hasProof: boolean; isPaid: boolean; isDisputed: boolean }[]>([])
  const [openSection, setOpenSection] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      const results = await Promise.all(claimants.map(async (addr) => {
        try {
          const [hasProof, isDisputed, isPaid] = await Promise.all([
            readContract(config, {
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi,
              functionName: 'proofSubmitted',
              args: [BigInt(jobId), addr as `0x${string}`],
            }) as Promise<boolean>,
            readContract(config, {
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi,
              functionName: 'disputed',
              args: [BigInt(jobId), addr as `0x${string}`],
            }) as Promise<boolean>,
            readContract(config, {
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi,
              functionName: 'paid',
              args: [BigInt(jobId), addr as `0x${string}`],
            }) as Promise<boolean>,
          ])
          return { addr, hasProof, isPaid, isDisputed }
        } catch (e) {
          console.error(`Failed to check proof for worker ${addr} on job ${jobId}:`, e)
          return { addr, hasProof: false, isPaid: false, isDisputed: false }
        }
      }))
      if (!cancelled) {
        setWorkers(results)
        const p = results.filter(w => w.hasProof && !w.isPaid)
        const pd = results.filter(w => w.isPaid)
        const c = results.filter(w => !w.hasProof && !w.isPaid)
        const onlyOneCategory = [p.length > 0, pd.length > 0, c.length > 0].filter(Boolean).length === 1
        if (onlyOneCategory) {
          if (p.length > 0) setOpenSection('pending')
          else if (c.length > 0) setOpenSection('claimed')
          else if (pd.length > 0) setOpenSection('paid')
        } else if (p.length > 0) {
          setOpenSection('pending')
        }
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [jobId, claimants, claimantsRefreshKey])

  const pending = workers.filter(w => w.hasProof && !w.isPaid)
  const paidList = workers.filter(w => w.isPaid)
  const claimed = workers.filter(w => !w.hasProof && !w.isPaid)

  const toggleSection = (section: string) => setOpenSection(openSection === section ? null : section)
  const sectionArrow = (section: string) => openSection === section ? '−' : '+'

  return (
    <div style={{ fontSize: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 10 }}>
        <span style={{ color: colors.green }}>{pending.length} pending</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span style={{ color: colors.textDim }}>{claimed.length} claimed</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span style={{ opacity: 0.5 }}>{paidList.length} paid</span>
      </div>
      {pending.length > 0 && (
        <div style={{ marginBottom: 6, border: `1px solid ${colors.bgElevated}`, borderRadius: radii.sm, overflow: 'hidden' }}>
          <button type="button" onClick={() => toggleSection('pending')} aria-expanded={openSection === 'pending'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'transparent', border: 'none', color: colors.green, fontWeight: 600, fontSize: 11, padding: '6px 8px', cursor: 'pointer' }}>
            <span>Proof Pending ({pending.length})</span>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{sectionArrow('pending')}</span>
          </button>
          <div style={{ maxHeight: openSection === 'pending' ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
            <div style={{ padding: '4px 8px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {pending.map((w, i) => (
                <PendingRow key={i} jobId={job.id} worker={w.addr} loading={loading} onRelease={onRelease} onDispute={onDispute} job={job} myAddress={myAddress} />
              ))}
            </div>
          </div>
        </div>
      )}
      {paidList.length > 0 && (
        <div style={{ marginBottom: 6, border: `1px solid ${colors.bgElevated}`, borderRadius: radii.sm, overflow: 'hidden' }}>
          <button type="button" onClick={() => toggleSection('paid')} aria-expanded={openSection === 'paid'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'transparent', border: 'none', color: colors.textDim, fontWeight: 600, fontSize: 11, padding: '6px 8px', cursor: 'pointer' }}>
            <span>Paid ({paidList.length})</span>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{sectionArrow('paid')}</span>
          </button>
          <div style={{ maxHeight: openSection === 'paid' ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
            <div style={{ padding: '2px 8px 8px' }}>
              {paidList.map((w, i) => (
                <div key={i} style={{ opacity: 0.6, padding: '2px 0', fontSize: 10, fontFamily: 'monospace' }}>{shorten(w.addr)} — paid</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {claimed.length > 0 && (
        <div style={{ marginBottom: 4, border: `1px solid ${colors.bgElevated}`, borderRadius: radii.sm, overflow: 'hidden' }}>
          <button type="button" onClick={() => toggleSection('claimed')} aria-expanded={openSection === 'claimed'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'transparent', border: 'none', color: colors.textDim, fontWeight: 600, fontSize: 11, padding: '6px 8px', cursor: 'pointer' }}>
            <span>Claimed ({claimed.length})</span>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{sectionArrow('claimed')}</span>
          </button>
          <div style={{ maxHeight: openSection === 'claimed' ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
            <div style={{ padding: '4px 8px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {claimed.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: colors.bgElevated, borderRadius: radii.sm }}>
                  <span style={{ fontFamily: 'monospace', flex: 1, fontSize: 10, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shorten(w.addr)}</span>
                  <button type="button" onClick={() => onDispute(job, w.addr)} aria-label={`Dispute worker ${shorten(w.addr)}`} style={{ background: 'transparent', color: colors.orange, border: `1px solid ${colors.orange}`, padding: '1px 6px', borderRadius: radii.sm, cursor: 'pointer', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }} title="File a dispute — worker has not submitted proof yet">DISPUTE</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PendingRow({ jobId, worker, loading, onRelease, onDispute, job, myAddress }: { jobId: number; worker: string; loading: boolean; onRelease: (w: string, j: Job) => void; onDispute: (j: Job, w?: string) => void; job: Job; myAddress?: string }) {
  const [exists, setExists] = useState<boolean | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [proofHash, setProofHash] = useState('')

  useEffect(() => {
    let cancelled = false
    const tryUrl = async (base: string) => {
      if (cancelled) return
      setProofUrl(base + '?download=1')
      setFileUrl(base)
      const ok = await fetch(base, { method: 'HEAD' }).then(r => r.ok).catch(() => false)
      if (!cancelled) setExists(ok)
      if (!ok) {
        const discovered = await discoverProofUrl(jobId, worker)
        if (discovered !== base && !cancelled) {
          setProofUrl(discovered + '?download=1')
          setFileUrl(discovered)
          const ok2 = await fetch(discovered, { method: 'HEAD' }).then(r => r.ok).catch(() => false)
          if (!cancelled) setExists(ok2)
        }
      }
    }
    fetchProofUrl(jobId, worker).then(url => {
      tryUrl(url || getProofUrl(jobId, worker))
    }).catch(() => {
      discoverProofUrl(jobId, worker).then(base => tryUrl(base))
    })
    fetchProofHash(jobId, worker).then(hash => {
      if (!cancelled && hash) setProofHash(hash)
    })
    return () => { cancelled = true }
  }, [jobId, worker])

  const downloadProof = async () => {
    if (!fileUrl) return
    try {
      const res = await fetch(fileUrl)
      if (!res.ok) return
      const blob = await res.blob()
      let filename = fileUrl.split('/').pop() || 'proof.bin'

      const magicExt = async (b: Blob): Promise<string> => {
        try {
          const buf = await b.slice(0, 8).arrayBuffer()
          const h = new Uint8Array(buf)
          if (h[0] === 0x50 && h[1] === 0x4B) return 'zip'
          if (h[0] === 0x52 && h[1] === 0x61 && h[2] === 0x72) return 'rar'
          if (h[0] === 0x37 && h[1] === 0x7A) return '7z'
          if (h[0] === 0x1F && h[1] === 0x8B) return 'gz'
          if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) return 'pdf'
          if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4E && h[3] === 0x47) return 'png'
          if (h[0] === 0xFF && h[1] === 0xD8) return 'jpg'
          if (h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46) return 'gif'
          if (h[0] === 0x42 && h[1] === 0x4D) return 'bmp'
        } catch { /* ignore */ }
        return ''
      }

      if (filename.endsWith('.bin')) {
        const magic = await magicExt(blob)
        if (magic) {
          filename = filename.slice(0, -4) + '.' + magic
        } else {
          const extMap: Record<string, string> = {
            'application/zip': 'zip', 'application/x-zip-compressed': 'zip',
            'application/x-rar-compressed': 'rar', 'application/x-7z-compressed': '7z',
            'application/gzip': 'gz', 'application/x-gzip': 'gz', 'application/pdf': 'pdf',
            'application/json': 'json', 'application/xml': 'xml',
            'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
            'image/svg+xml': 'svg', 'image/webp': 'webp', 'text/plain': 'txt',
          }
          filename = filename.slice(0, -4) + '.' + (extMap[blob.type] || 'bin')
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: colors.bgElevated, borderRadius: radii.sm }}>
      <span style={{ fontFamily: 'monospace', flex: 1, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shorten(worker)}</span>
      {exists === true ? (
        <button type="button" onClick={downloadProof} style={{ fontSize: 10, color: colors.blue, textDecoration: 'none', whiteSpace: 'nowrap', padding: '2px 6px', border: `1px solid ${colors.blue}`, borderRadius: radii.sm, cursor: 'pointer', background: 'transparent' }}>DOWNLOAD PROOF</button>
      ) : exists === false ? (
        <span style={{ fontSize: 10, opacity: 0.3, whiteSpace: 'nowrap', padding: '2px 6px' }}>NO FILE</span>
      ) : (
        <span style={{ fontSize: 10, opacity: 0.3, whiteSpace: 'nowrap', padding: '2px 6px' }}>...</span>
      )}
      {proofHash && (
        <span title={`Proof hash: ${proofHash}\nVerify by running: keccak256( downloaded file )`} style={{ fontSize: 9, opacity: 0.4, cursor: 'help', fontFamily: 'monospace', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proofHash.slice(0, 10)}...</span>
      )}
      <button type="button" onClick={() => onRelease(worker, job)} disabled={loading} aria-label={`Release payment to ${shorten(worker)}`} style={{ background: colors.green, color: '#000', border: 'none', padding: '2px 6px', fontWeight: 700, borderRadius: radii.sm, cursor: 'pointer', fontSize: 10, whiteSpace: 'nowrap' }}>RELEASE</button>
      <button type="button" onClick={() => onDispute(job, worker)} aria-label={`Dispute worker ${shorten(worker)}`} style={{ background: 'transparent', color: colors.orange, border: `1px solid ${colors.orange}`, padding: '1px 6px', borderRadius: radii.sm, cursor: 'pointer', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>DISPUTE</button>
    </div>
  )
}
