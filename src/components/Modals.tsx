import { useState, useRef, useEffect } from 'react'
import type { Job, ConfirmAction, DisputeState } from '../types'
import { uploadAvatar } from '../hooks/useWorkerProfiles'

const shorten = (addr: string) => addr.length > 10 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr

function useEscape(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
}

export function JobDetailModal({ job, onClose, onClaim, loading }: { job: Job; onClose: () => void; onClaim: (job: Job) => void; loading: boolean }) {
  useEscape(onClose)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} role="dialog" aria-modal="true" aria-label={`Job details: ${job.title}`}>
      <div style={{ background: '#111', border: '1px solid #444', padding: 32, borderRadius: 10, maxWidth: 520, width: '90%' }}>
        <h3 style={{ marginTop: 0 }}>{job.title}</h3>
        <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 16 }}>{job.description}</div>
        <div style={{ margin: '20px 0', fontSize: 12, lineHeight: 1.6 }}>
          <div><strong>Requirements:</strong> {job.requirements}</div>
          <div><strong>Difficulty:</strong> {job.difficulty}</div>
          <div><strong>Reward:</strong> {job.reward} {job.tokenSymbol || 'zkLTC'}</div>
          <div><strong>Deadline:</strong> {job.deadline}</div>
          <div><strong>Slots:</strong> {job.claimedCount}/{job.maxWorkers} workers</div>
          <div><strong>Posted by:</strong> {shorten(job.poster)}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} aria-label="Close job details" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: 6 }}>CLOSE</button>
          <button onClick={() => onClaim(job)} disabled={loading} aria-label={`Claim job: ${job.title}`} style={{ flex: 1, padding: 12, background: '#ffd700', color: '#000', fontWeight: 700, border: 'none', borderRadius: 6 }}>CLAIM THIS JOB</button>
        </div>
      </div>
    </div>
  )
}

export function ProofModal({ job, proofHash, onProofHashChange, onSubmit, onClose, loading }: {
  job: Job; proofHash: string; onProofHashChange: (v: string) => void; onSubmit: () => void; onClose: () => void; loading: boolean
}) {
  useEscape(onClose)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} role="dialog" aria-modal="true" aria-label="Submit proof">
      <div style={{ background: '#111', border: '1px solid #444', padding: 32, borderRadius: 10, maxWidth: 420, width: '90%' }}>
        <h3 style={{ marginTop: 0 }}>Submit ZK Proof</h3>
        <div style={{ opacity: 0.7, fontSize: 12 }}>{job.title} &mdash; {job.reward} {job.tokenSymbol || 'zkLTC'}</div>
        <input placeholder="0xproof..." value={proofHash} onChange={e => onProofHashChange(e.target.value)} aria-label="Proof hash" style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 12, color: '#fff', margin: '16px 0', fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} aria-label="Cancel proof submission" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: 6 }}>CANCEL</button>
          <button onClick={onSubmit} disabled={loading} aria-label="Submit proof" style={{ flex: 1, padding: 12, background: '#ffd700', color: '#000', fontWeight: 700, border: 'none', borderRadius: 6 }}>VERIFY PROOF</button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmModal({ action, onCancel, onConfirm }: { action: ConfirmAction; onCancel: () => void; onConfirm: () => void }) {
  useEscape(onCancel)
  const typeLabel = action.type === 'unclaim' ? 'Unclaim Job?' : action.type === 'deactivate' ? 'Cancel & Refund?' : action.type === 'dispute' ? 'Raise Dispute?' : action.type === 'resolveCancel' ? 'Accept Cancellation?' : 'Submit Proof?'
  const refundAmount = action.type === 'deactivate' && action.job ? `${action.job.reward * action.job.maxWorkers} ${action.job.tokenSymbol || 'zkLTC'}` : ''
  const msg = action.type === 'unclaim' ? `Are you sure you want to unclaim "${action.job?.title}"?` :
    action.type === 'deactivate' ? `Cancel "${action.job?.title}"?\n\nEscrowed funds will be refunded: ${refundAmount}\nNo workers have claimed this job yet.` :
    action.type === 'dispute' ? `File a dispute for "${action.job?.title}"?\n\nWorker: ${(action.disputeWorker || '').slice(0, 8)}...\nReason: ${action.disputeReason || '—'}` :
    action.type === 'resolveCancel' ? `Accept cancellation for "${action.job?.title}"? This will remove your claim.` :
    `Verify and submit proof for "${action.job?.title}"?`
  const btnLabel = action.type === 'unclaim' ? 'UNCLAIM' : action.type === 'deactivate' ? 'CANCEL & REFUND' : action.type === 'dispute' ? 'FILE DISPUTE' : action.type === 'resolveCancel' ? 'ACCEPT CANCEL' : 'VERIFY PROOF'
  const btnColor = action.type === 'unclaim' || action.type === 'deactivate' ? '#ff6b6b' : action.type === 'resolveCancel' ? '#f97316' : '#ffd700'
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} role="dialog" aria-modal="true" aria-label={typeLabel}>
      <div style={{ background: '#111', border: '1px solid #444', padding: 32, borderRadius: 12, maxWidth: 420, width: '90%' }}>
        <h3 style={{ marginTop: 0 }}>{typeLabel}</h3>
        <div style={{ opacity: 0.8, whiteSpace: 'pre-wrap' }}>{msg}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onCancel} aria-label="Cancel action" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: 8 }}>CANCEL</button>
          <button onClick={onConfirm} aria-label={btnLabel} style={{ flex: 1, padding: 12, background: btnColor, color: action.type === 'unclaim' || action.type === 'deactivate' ? '#fff' : '#000', fontWeight: 700, border: 'none', borderRadius: 8 }}>{btnLabel}</button>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} role="dialog" aria-modal="true" aria-label="Edit profile">
      <div style={{ background: '#111', border: '1px solid #444', padding: 32, borderRadius: 12, width: '90%', maxWidth: 440, maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Edit Profile</h3>

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 12, border: '2px solid #444', overflow: 'hidden', background: '#1a1a1a', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
              }
            </div>
            <div onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -6, right: -6, width: 22, height: 22, background: '#ffd700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11 }}>✏️</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Profile Photo</div>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} aria-label="Choose profile image" style={{ padding: '6px 14px', background: '#222', border: '1px solid #555', color: '#fff', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
              {uploadingAvatar ? 'Uploading...' : '📁 Choose Image'}
            </button>
            <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>Max 2MB · JPG, PNG, GIF, WebP</div>
            {uploadError && <div style={{ fontSize: 10, color: '#ff6b6b', marginTop: 4 }}>{uploadError}</div>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>Bio</div>
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 12, color: '#fff', borderRadius: 8, minHeight: 90, fontSize: 12, boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>Skills</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {skills.map((s, i) => (
              <span key={i} style={{ background: '#222', padding: '5px 13px', borderRadius: 999, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {s} <span onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} aria-label={`Remove skill ${s}`} style={{ cursor: 'pointer', color: '#f66', fontWeight: 700 }}>&times;</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={editSkillInput} onChange={e => setEditSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && editSkillInput.trim()) { setSkills([...skills, editSkillInput.trim()]); setEditSkillInput('') } }} placeholder="Add skill (Enter to add)" style={{ flex: 1, background: '#000', border: '1px solid #444', padding: '10px 12px', color: '#fff', borderRadius: 8, fontSize: 12 }} />
            <button onClick={() => { if (editSkillInput.trim()) { setSkills([...skills, editSkillInput.trim()]); setEditSkillInput('') } }} style={{ padding: '0 18px', background: '#222', border: '1px solid #555', color: '#fff', borderRadius: 8 }}>+</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button onClick={onClose} aria-label="Cancel editing profile" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: 8 }}>CANCEL</button>
          <button onClick={onSave} disabled={uploadingAvatar} aria-label="Save profile" style={{ flex: 1, padding: 12, background: '#ffd700', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8 }}>{uploadingAvatar ? 'UPLOADING...' : 'SAVE'}</button>
        </div>
      </div>
    </div>
  )
}

export function DisputeModal({ dispute, onReasonChange, onSubmit, onClose, loading }: {
  dispute: DisputeState; onReasonChange: (v: string) => void; onSubmit: () => void; onClose: () => void; loading: boolean
}) {
  useEscape(onClose)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} role="dialog" aria-modal="true" aria-label="Raise dispute">
      <div style={{ background: '#111', border: '1px solid #f97316', padding: 32, borderRadius: 12, maxWidth: 440, width: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#f97316' }}>Raise Dispute</h3>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Job: <strong>{dispute.job?.title || 'Unknown'}</strong></div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Reward: {dispute.job?.reward || '—'} {dispute.job?.tokenSymbol || 'zkLTC'}</div>
          {dispute.worker && <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace', marginTop: 4 }}>Worker: {dispute.worker.slice(0, 8)}...{dispute.worker.slice(-6)}</div>}
        </div>
        <textarea placeholder="Describe your reason for dispute..." value={dispute.reason} onChange={e => onReasonChange(e.target.value)} aria-label="Dispute reason" style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 12, color: '#fff', minHeight: 100, fontSize: 13, borderRadius: 8 }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} aria-label="Cancel dispute" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: 8 }}>CANCEL</button>
          <button onClick={onSubmit} disabled={loading || !dispute.reason.trim()} aria-label="Submit dispute" style={{ flex: 1, padding: 12, background: '#f97316', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8 }}>{loading ? 'FILING...' : 'FILE DISPUTE'}</button>
        </div>
      </div>
    </div>
  )
}
