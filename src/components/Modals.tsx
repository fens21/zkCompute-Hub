import { useState, useRef, useEffect } from 'react'
import { keccak256 } from 'viem'
import type { Job, ConfirmAction, DisputeState } from '../types'
import { JOB_TYPE_CONFIGS } from '../constants/jobTypes'
import { uploadAvatar } from '../hooks/useWorkerProfiles'
import { colors, radii, fontSizes, modalOverlay } from '../styles/tokens'
import { formatDeadlineDate, getDeadlineMs, formatTimeRemaining, COUNTDOWN_REFRESH } from '../utils'
import { useFocusTrap } from '../hooks/useFocusTrap'

const shorten = (addr: string) => addr.length > 10 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr

function useEscape(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
}

function useAriaHidden(open: boolean) {
  useEffect(() => {
    if (!open) return
    const root = document.getElementById('root') || document.body
    const prev = root.getAttribute('aria-hidden')
    root.setAttribute('aria-hidden', 'true')
    return () => {
      if (prev) root.setAttribute('aria-hidden', prev)
      else root.removeAttribute('aria-hidden')
    }
  }, [open])
}

export function JobDetailModal({ job, onClose, onClaim, loading }: { job: Job; onClose: () => void; onClaim: (job: Job) => void; loading: boolean }) {
  useEscape(onClose)
  useAriaHidden(true)
  const trapRef = useFocusTrap(true)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setNow(Date.now()) }, COUNTDOWN_REFRESH)
    return () => clearInterval(id)
  }, [])

  let deadlineDisplay: React.ReactNode
  const endMs = getDeadlineMs(job.createdAt, job.deadline)
  if (endMs === null) {
    deadlineDisplay = <span style={{ opacity: 0.5 }}>{job.deadline}</span>
  } else {
    const remaining = endMs - now
    if (remaining <= 0) {
      deadlineDisplay = <span style={{ color: colors.red }}>{formatDeadlineDate(job.createdAt, job.deadline)} (expired)</span>
    } else {
      const color = remaining < 3600000 ? colors.orange : colors.textDim
      deadlineDisplay = <span style={{ color }}>{formatDeadlineDate(job.createdAt, job.deadline)} ({formatTimeRemaining(remaining)} left)</span>
    }
  }

  return (
    <div ref={trapRef} style={modalOverlay} role="dialog" aria-modal="true" aria-label={`Job details: ${job.title}`}>
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, padding: 32, borderRadius: radii.lg, maxWidth: 520, width: '90%' }}>
        <h3 style={{ marginTop: 0 }}>{job.title}</h3>
        <div style={{ opacity: 0.8, fontSize: fontSizes.md, marginBottom: 16 }}>{job.description}</div>
        <div style={{ margin: '20px 0', fontSize: fontSizes.base, lineHeight: 1.6 }}>
          <div><strong>Requirements:</strong> {job.requirements}</div>
          <div><strong>Reward:</strong> {job.reward} {job.tokenSymbol || 'zkLTC'}</div>
          <div><strong>Deadline:</strong> {deadlineDisplay}</div>
          <div><strong>Slots:</strong> {job.claimedCount}/{job.maxWorkers} workers</div>
          <div><strong>Posted by:</strong> {shorten(job.poster)}</div>
          {job.parameters && Object.keys(job.parameters).length > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: radii.sm }}>
              <div style={{ fontWeight: 700, fontSize: fontSizes.sm, marginBottom: 6, color: JOB_TYPE_CONFIGS[job.type]?.color || colors.gold }}>
                {JOB_TYPE_CONFIGS[job.type]?.label || job.type} Parameters
              </div>
              {Object.entries(job.parameters).map(([key, val]) => {
                if (!val) return null
                const label = JOB_TYPE_CONFIGS[job.type]?.fields.find(f => f.key === key)?.label || key
                return (
                  <div key={key} style={{ fontSize: fontSizes.sm, opacity: 0.8, marginBottom: 3 }}>
                    <span style={{ opacity: 0.5 }}>{label}:</span> {val}
                  </div>
                )
              })}
            </div>
          )}
          {job.verificationMethod && (
            <div style={{ marginTop: 8 }}><strong>Verification:</strong> {job.verificationMethod === 'zk-proof' ? 'On-chain ZK Proof' : job.verificationMethod === 'hash-check' ? 'Off-chain Hash Check' : 'Manual Review'}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} aria-label="Close job details" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.sm }}>CLOSE</button>
          <button onClick={() => onClaim(job)} disabled={loading} aria-label={`Claim job: ${job.title}`} style={{ flex: 1, padding: 12, background: colors.gold, color: '#000', fontWeight: 700, border: 'none', borderRadius: radii.sm }}>CLAIM THIS JOB</button>
        </div>
      </div>
    </div>
  )
}

export function ProofModal({ job, proofHash, onProofHashChange, onProofFileChange, onSubmit, onClose, loading }: {
  job: Job; proofHash: string; onProofHashChange: (v: string) => void; onProofFileChange?: (f: File | null) => void; onSubmit: () => void; onClose: () => void; loading: boolean
}) {
  useEscape(onClose)
  useAriaHidden(true)
  const trapRef = useFocusTrap(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isHashing, setIsHashing] = useState(false)
  const [fileError, setFileError] = useState('')

  const MAX_SIZE = 10 * 1024 * 1024

  const ALLOWED_TYPES = new Set([
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/gzip', 'application/x-gzip',
    'application/json', 'application/xml', 'text/plain', 'text/xml',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/octet-stream',
  ])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setFileError('')

    if (file.size > MAX_SIZE) {
      setFileError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`)
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const blockedExt = ['exe', 'dll', 'msi', 'bat', 'cmd', 'sh', 'ps1', 'app', 'deb', 'rpm', 'js', 'py', 'rb', 'php', 'pl', 'wasm', 'html', 'htm', 'swf', 'jar']
    if (blockedExt.includes(ext)) {
      setFileError(`File type ".${ext}" is not allowed.`)
      return
    }

    if (!ALLOWED_TYPES.has(file.type) && file.type) {
      setFileError(`File type "${file.type}" is not supported.`)
      return
    }

    setFileName(file.name)
    setFileSize(file.size)
    setIsHashing(true)
    try {
      const buf = await file.arrayBuffer()
      const hash = keccak256(new Uint8Array(buf))
      onProofHashChange(hash)
      onProofFileChange?.(file)
    } catch {
      setFileError('Failed to read file. Try again.')
      setFileName('')
      setFileSize(0)
    }
    setIsHashing(false)
  }

  const clearFile = () => {
    setFileName('')
    setFileSize(0)
    setFileError('')
    onProofHashChange('')
    onProofFileChange?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const fmtSize = (bytes: number) =>
    bytes < 1024 ? `${bytes}B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / 1024 / 1024).toFixed(2)}MB`

  return (
    <div ref={trapRef} style={modalOverlay} role="dialog" aria-modal="true" aria-label="Submit proof">
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, padding: 32, borderRadius: radii.lg, maxWidth: 420, width: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: 4 }}>Submit ZK Proof</h3>
        <div style={{ opacity: 0.7, fontSize: fontSizes.base, marginBottom: 20 }}>{job.title} &mdash; {job.reward} {job.tokenSymbol || 'zkLTC'}</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: fontSizes.sm, opacity: 0.5, marginBottom: 6, fontWeight: 600 }}>Upload Proof File</div>
          <div
            role="button"
            aria-label="Upload proof file"
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isHashing && inputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragOver ? colors.blue : fileName && !fileError ? colors.green : fileError ? colors.red : colors.border}`,
              borderRadius: radii.md,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: isHashing ? 'wait' : 'pointer',
              background: isDragOver ? 'rgba(56,189,248,0.08)' : fileName && !fileError ? '#0a1f0a' : fileError ? '#1f0a0a' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <input ref={inputRef} type="file" accept="*/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />

            {isHashing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #444', borderTopColor: colors.blue, borderRadius: '50%', animation: 'spinner 0.8s linear infinite' }} />
                <div style={{ fontSize: fontSizes.sm, color: colors.blue }}>Hashing file...</div>
              </div>
            ) : fileName && !fileError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: fontSizes.heading }}></div>
                <div style={{ color: colors.green, fontSize: fontSizes.base, fontWeight: 600 }}>{fileName}</div>
                <div style={{ fontSize: fontSizes.xs, opacity: 0.4 }}>{fmtSize(fileSize)}</div>
                <div role="button" aria-label="Remove proof file" onClick={e => { e.stopPropagation(); clearFile() }} style={{ marginTop: 4, fontSize: fontSizes.xs, color: colors.red, textDecoration: 'underline', cursor: 'pointer' }}>Remove file</div>
              </div>
            ) : fileError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: fontSizes.sm, color: colors.red }}>{fileError}</div>
                <div style={{ fontSize: fontSizes.xs, opacity: 0.5 }}>Click or drop another file</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: fontSizes.heading }}></div>
                <div style={{ fontSize: fontSizes.base, opacity: 0.7 }}>Drop proof file here</div>
                <div style={{ fontSize: fontSizes.xs, opacity: 0.35 }}>or click to browse &bull; any file type &bull; max 10MB</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: colors.border }} />
          <span style={{ fontSize: fontSizes.xs, opacity: 0.35, whiteSpace: 'nowrap' }}>OR MANUAL HASH</span>
          <div style={{ flex: 1, height: 1, background: colors.border }} />
        </div>

        <input
          placeholder="0xproof..."
          value={proofHash}
          onChange={e => { onProofHashChange(e.target.value); if (e.target.value !== proofHash && fileName) clearFile() }}
          aria-label="Proof hash"
          style={{
            width: '100%', background: '#000', border: `1px solid ${proofHash && !proofHash.startsWith('0x') ? colors.orange : colors.border}`,
            padding: 12, color: colors.textPrimary, fontSize: fontSizes.md, boxSizing: 'border-box', borderRadius: radii.sm,
            fontFamily: 'monospace',
          }}
        />
        {proofHash && !proofHash.startsWith('0x') && (
          <div style={{ fontSize: fontSizes.xs, color: colors.orange, marginTop: 4 }}>Hash should start with &quot;0x&quot;</div>
        )}
        {proofHash && proofHash.startsWith('0x') && (
          <div style={{ fontSize: fontSizes.xs, opacity: 0.4, marginTop: 4, wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {proofHash.slice(0, 18)}...{proofHash.slice(-10)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} disabled={isHashing} aria-label="Cancel proof submission" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.sm, cursor: isHashing ? 'not-allowed' : 'pointer', opacity: isHashing ? 0.5 : 1 }}>CANCEL</button>
          <button onClick={onSubmit} disabled={loading || isHashing || !proofHash} aria-label="Submit proof" style={{ flex: 1, padding: 12, background: !proofHash ? colors.borderLight : loading ? '#b8960f' : colors.gold, color: !proofHash ? '#666' : '#000', fontWeight: 700, border: 'none', borderRadius: radii.sm, cursor: loading || !proofHash || isHashing ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>{loading ? 'SUBMITTING...' : isHashing ? 'HASHING...' : 'SUBMIT PROOF'}</button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({ action, onCancel, onConfirm }: { action: ConfirmAction; onCancel: () => void; onConfirm: () => void }) {
  useEscape(onCancel)
  useAriaHidden(true)
  const trapRef = useFocusTrap(true)
  const typeLabel = action.type === 'unclaim' ? 'Unclaim Job?' : action.type === 'deactivate' ? 'Cancel & Refund?' : action.type === 'dispute' ? 'Raise Dispute?' : action.type === 'resolveCancel' ? 'Accept Cancellation?' : 'Submit Proof?'
  const refundAmount = action.type === 'deactivate' && action.job ? `${action.job.reward * action.job.maxWorkers} ${action.job.tokenSymbol || 'zkLTC'}` : ''
  const claimantsInfo = action.claimantCount && action.claimantCount > 0 ? `\n${action.claimantCount} worker(s) have already claimed this job. Cancelling will remove their claims and they may lose rewards.` : '\nNo workers have claimed this job yet.'
  const msg = action.type === 'unclaim' ? `Unclaim "${action.job?.title}"?\n\nThis will remove your claim and you will lose any progress. You can claim the job again later if slots are available.` :
    action.type === 'deactivate' ? `Cancel "${action.job?.title}"?\n\nEscrowed funds will be refunded: ${refundAmount}${claimantsInfo}` :
    action.type === 'dispute' ? `File a dispute for "${action.job?.title}"?\n\nWorker: ${(action.disputeWorker || '').slice(0, 8)}...\nReason: ${action.disputeReason || '—'}` :
    action.type === 'resolveCancel' ? `Accept cancellation for "${action.job?.title}"? This will remove your claim.` :
    `Verify and submit proof for "${action.job?.title}"?`
  const btnLabel = action.type === 'unclaim' ? 'UNCLAIM' : action.type === 'deactivate' ? 'CANCEL & REFUND' : action.type === 'dispute' ? 'FILE DISPUTE' : action.type === 'resolveCancel' ? 'ACCEPT CANCEL' : 'VERIFY PROOF'
  const btnColor = action.type === 'unclaim' || action.type === 'deactivate' ? colors.red : action.type === 'resolveCancel' ? colors.orange : colors.gold
  return (
    <div ref={trapRef} style={{ ...modalOverlay, zIndex: 200 }} role="dialog" aria-modal="true" aria-label={typeLabel}>
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, padding: 32, borderRadius: radii.xl, maxWidth: 420, width: '90%' }}>
        <h3 style={{ marginTop: 0 }}>{typeLabel}</h3>
        <div style={{ opacity: 0.8, whiteSpace: 'pre-wrap' }}>{msg}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onCancel} aria-label="Cancel action" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.md }}>CANCEL</button>
          <button onClick={onConfirm} aria-label={btnLabel} style={{ flex: 1, padding: 12, background: btnColor, color: action.type === 'unclaim' || action.type === 'deactivate' ? '#fff' : '#000', fontWeight: 700, border: 'none', borderRadius: radii.md }}>{btnLabel}</button>
        </div>
      </div>
    </div>
  )
}

export function EditProfileModal({ editBio, setEditBio, editSkillInput, setEditSkillInput, skills, setSkills, onClose, onSave, account, currentAvatarUrl, onAvatarChange }: {
  editBio: string; setEditBio: (v: string) => void; editSkillInput: string; setEditSkillInput: (v: string) => void
  skills: string[]; setSkills: (v: string[]) => void; onClose: () => void; onSave: () => void
  account: string; currentAvatarUrl?: string; onAvatarChange?: (url: string) => void
}) {
  const [avatarPreview, setAvatarPreview] = useState<string>(currentAvatarUrl || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  useEscape(onClose)
  useAriaHidden(true)
  const trapRef = useFocusTrap(true)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setUploadError('File too large. Max 2MB.'); return }
    if (!file.type.startsWith('image/')) { setUploadError('Only image files allowed.'); return }
    setUploadError('')
    setUploadingAvatar(true)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    const url = await uploadAvatar(account, file)
    if (url) { setAvatarPreview(url); onAvatarChange?.(url) }
    else setUploadError('Upload failed. Try again.')
    setUploadingAvatar(false)
  }

  return (
    <div ref={trapRef} style={modalOverlay} role="dialog" aria-modal="true" aria-label="Edit profile">
      <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, padding: 32, borderRadius: radii.xl, width: '90%', maxWidth: 440, maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Edit Profile</h3>

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div role="button" aria-label="Change profile photo" style={{ width: 72, height: 72, borderRadius: radii.xl, border: '2px solid #444', overflow: 'hidden', background: colors.bgElevated, cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}></div>
              }
            </div>
            <div role="button" aria-label="Edit profile photo" onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -6, right: -6, width: 22, height: 22, background: colors.gold, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: fontSizes.sm }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: fontSizes.base, opacity: 0.7, marginBottom: 6 }}>Profile Photo</div>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} aria-label="Choose profile image" style={{ padding: '6px 14px', background: '#222', border: '1px solid #555', color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.sm, cursor: 'pointer' }}>
              {uploadingAvatar ? 'Uploading...' : 'Choose Image'}
            </button>
            <div style={{ fontSize: fontSizes.xs, opacity: 0.4, marginTop: 4 }}>Max 2MB · JPG, PNG, GIF, WebP</div>
            {uploadError && <div style={{ fontSize: fontSizes.xs, color: colors.red, marginTop: 4 }}>{uploadError}</div>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 6 }}>Bio</div>
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} aria-label="Bio" style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 12, color: colors.textPrimary, borderRadius: radii.md, minHeight: 90, fontSize: fontSizes.base, boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 8 }}>Skills</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {skills.map((s, i) => (
              <span key={i} style={{ background: '#222', padding: '5px 13px', borderRadius: radii.full, fontSize: fontSizes.sm, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {s} <span onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} aria-label={`Remove skill ${s}`} style={{ cursor: 'pointer', color: '#f66', fontWeight: 700 }}>&times;</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={editSkillInput} onChange={e => setEditSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && editSkillInput.trim()) { setSkills([...skills, editSkillInput.trim()]); setEditSkillInput('') } }} placeholder="Add skill (Enter to add)" aria-label="Add skill" style={{ flex: 1, background: '#000', border: `1px solid ${colors.border}`, padding: '10px 12px', color: colors.textPrimary, borderRadius: radii.md, fontSize: fontSizes.base }} />
            <button onClick={() => { if (editSkillInput.trim()) { setSkills([...skills, editSkillInput.trim()]); setEditSkillInput('') } }} aria-label="Add skill" style={{ padding: '0 18px', background: '#222', border: '1px solid #555', color: colors.textPrimary, borderRadius: radii.md }}>+</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button onClick={onClose} aria-label="Cancel editing profile" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.md }}>CANCEL</button>
          <button onClick={onSave} disabled={uploadingAvatar} aria-label="Save profile" style={{ flex: 1, padding: 12, background: colors.gold, color: '#000', fontWeight: 700, border: 'none', borderRadius: radii.md }}>{uploadingAvatar ? 'UPLOADING...' : 'SAVE'}</button>
        </div>
      </div>
    </div>
  )
}

export function DisputeModal({ dispute, onReasonChange, onSubmit, onClose, loading }: {
  dispute: DisputeState; onReasonChange: (v: string) => void; onSubmit: () => void; onClose: () => void; loading: boolean
}) {
  useEscape(onClose)
  useAriaHidden(true)
  const trapRef = useFocusTrap(true)
  const reasonLen = dispute.reason.trim().length
  return (
    <div ref={trapRef} style={modalOverlay} role="dialog" aria-modal="true" aria-label="Raise dispute">
      <div style={{ background: colors.bgCard, border: '1px solid #f97316', padding: 32, borderRadius: radii.xl, maxWidth: 440, width: '90%' }}>
        <h3 style={{ marginTop: 0, color: colors.orange }}>Raise Dispute</h3>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: fontSizes.base, opacity: 0.7 }}>Job: <strong>{dispute.job?.title || 'Unknown'}</strong></div>
          <div style={{ fontSize: fontSizes.base, opacity: 0.7 }}>Reward: {dispute.job?.reward || '—'} {dispute.job?.tokenSymbol || 'zkLTC'}</div>
          {dispute.worker && <div style={{ fontSize: fontSizes.sm, opacity: 0.6, fontFamily: 'monospace', marginTop: 4 }}>Worker: {dispute.worker.slice(0, 8)}...{dispute.worker.slice(-6)}</div>}
        </div>
        <div style={{ position: 'relative' }}>
          <textarea placeholder="Describe your reason for dispute... (min 10 characters)" value={dispute.reason} onChange={e => onReasonChange(e.target.value)} aria-label="Dispute reason" style={{ width: '100%', background: '#000', border: `1px solid ${reasonLen > 0 && reasonLen < 10 ? colors.orange : colors.border}`, padding: 12, color: colors.textPrimary, minHeight: 100, fontSize: fontSizes.md, borderRadius: radii.md }} />
          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, opacity: 0.35 }}>{reasonLen}/10 min</span>
        </div>
        {reasonLen > 0 && reasonLen < 10 && <div style={{ fontSize: 9, color: colors.orange, marginTop: 2 }}>Minimum 10 characters required</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} aria-label="Cancel dispute" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.md }}>CANCEL</button>
          <button onClick={onSubmit} disabled={loading || reasonLen < 10} aria-label="Submit dispute" style={{ flex: 1, padding: 12, background: colors.orange, color: '#000', fontWeight: 700, border: 'none', borderRadius: radii.md }}>{loading ? 'FILING...' : 'FILE DISPUTE'}</button>
        </div>
      </div>
    </div>
  )
}

export function ZKSolutionModal({
  job,
  solution,
  onSolutionChange,
  onSubmit,
  onClose,
  loading,
}: {
  job: Job
  solution: string
  onSolutionChange: (v: string) => void
  onSubmit: () => void
  onClose: () => void
  loading: boolean
}) {
  useEscape(onClose)
  useAriaHidden(true)
  const trapRef = useFocusTrap(true)

  const target = job.expectedOutput || job.parameters?.expectedOutput || '— (job poster did not set a target)'

  return (
    <div ref={trapRef} style={modalOverlay} role="dialog" aria-modal="true" aria-label="Submit ZK solution proof">
      <div style={{ background: colors.bgCard, border: `1px solid #a78bfa`, padding: 28, borderRadius: radii.lg, maxWidth: 460, width: '92%' }}>
        <h3 style={{ marginTop: 0, marginBottom: 4, color: '#c4b5fd' }}>Submit ZK Proof (Verifiable Compute)</h3>
        <div style={{ opacity: 0.75, fontSize: fontSizes.base, marginBottom: 16 }}>
          {job.title} — {job.reward} {job.tokenSymbol || 'zkLTC'}
        </div>

        <div style={{ fontSize: fontSizes.sm, lineHeight: 1.5, marginBottom: 16, background: 'rgba(167,139,250,0.08)', padding: 12, borderRadius: radii.sm }}>
          Enter the <strong>solution / computed result</strong> you found for this job.
          The ZK proof will cryptographically prove that you know the correct value that matches the job's target — without revealing your solution on-chain.
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: fontSizes.xs, opacity: 0.5, marginBottom: 4 }}>JOB TARGET (expectedOutput)</div>
          <div style={{ fontFamily: 'monospace', fontSize: fontSizes.sm, background: '#111', padding: '8px 10px', borderRadius: radii.sm, wordBreak: 'break-all', opacity: 0.9 }}>
            {target}
          </div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 6 }}>Your Solution (private input)</div>
          <input
            placeholder="e.g. 123456 or the secret string / hash result"
            value={solution}
            onChange={(e) => onSolutionChange(e.target.value)}
            aria-label="Solution for ZK proof"
            style={{
              width: '100%',
              background: '#000',
              border: `1px solid ${solution ? '#a78bfa' : colors.border}`,
              padding: '12px 14px',
              color: colors.textPrimary,
              fontSize: fontSizes.md,
              borderRadius: radii.sm,
              fontFamily: 'monospace',
            }}
          />
          <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>
            This value stays in your browser. Only the ZK proof (that you know it) goes on-chain.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Cancel ZK proof"
            style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.sm, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            CANCEL
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !solution.trim()}
            aria-label="Generate and submit ZK proof"
            style={{
              flex: 1,
              padding: 12,
              background: !solution.trim() ? '#3a2f5a' : loading ? '#6b5fa3' : '#a78bfa',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              borderRadius: radii.sm,
              cursor: loading || !solution.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'GENERATING & SUBMITTING...' : 'GENERATE ZK PROOF & SUBMIT'}
          </button>
        </div>

        <div style={{ fontSize: 10, opacity: 0.35, marginTop: 12, textAlign: 'center' }}>
          Requires the correct solution that satisfies the job's ZK target.
        </div>
      </div>
    </div>
  )
}


