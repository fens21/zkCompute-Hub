import { useState, useEffect } from 'react'
import type { Job, NewJobForm, PostSubTab } from '../types'
import { PostedJobCard } from './PostedJobCard'
import { colors, radii } from '../styles/tokens'

type ViewMode = 'grid' | 'list'

const TOKEN_SYMBOLS: Record<string, string> = { zkLTC: 'zkLTC', USDC: 'USDC', custom: 'CUSTOM' }
const TOKEN_COLORS: Record<string, string> = { zkLTC: colors.gold, USDC: colors.blue, custom: '#a855f7' }

export function PostJob({ postSubTab, setPostSubTab, newJob, setNewJob, postedJobs, onPost, onReleaseWorker, onDeactivate, onDispute, loading, deactivating, onEditPostedJob, editingPostedJob, editTitle, setEditTitle, editType, setEditType, editDesc, setEditDesc, editReqs, setEditReqs, editDeadline, setEditDeadline, editDifficulty, setEditDifficulty, onSaveEdit, onCancelEdit, address }: {
  postSubTab: PostSubTab
  setPostSubTab: (v: PostSubTab) => void
  newJob: NewJobForm
  setNewJob: React.Dispatch<React.SetStateAction<NewJobForm>>
  postedJobs: Job[]
  onPost: () => void
  onReleaseWorker: (worker: string, j: Job) => void
  onDeactivate: (j: Job) => void
  onDispute: (j: Job, worker?: string) => void
  loading: boolean
  deactivating: boolean
  onEditPostedJob: (j: Job) => void
  editingPostedJob: Job | null
  editTitle: string
  setEditTitle: (v: string) => void
  editType: string
  setEditType: (v: string) => void
  editDesc: string
  setEditDesc: (v: string) => void
  editReqs: string
  setEditReqs: (v: string) => void
  editDeadline: string
  setEditDeadline: (v: string) => void
  editDifficulty: string
  setEditDifficulty: (v: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  address?: string
}) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const [postedViewMode, setPostedViewMode] = useState<ViewMode>('grid')
  const editDeadlineMs = editDeadline ? Date.parse(editDeadline) : NaN
  const editDeadlineInvalid = editDeadline ? isNaN(editDeadlineMs) : false
  const editDeadlinePast = !editDeadlineInvalid && !isNaN(editDeadlineMs) && editDeadlineMs <= Date.now()

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, margin: 0, marginBottom: 12 }}>
          {postSubTab === 'new' ? 'Post New Compute Job' : 'Manage Posted Jobs'}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: colors.bgElevated, borderRadius: radii.md, padding: 4 }}>

            <button onClick={() => setPostSubTab('new')} aria-label="New Job tab" style={{
              flex: 1, padding: '7px 16px', borderRadius: radii.sm, cursor: 'pointer', fontWeight: 700, fontSize: 11, border: 'none',
              background: postSubTab === 'new' ? colors.gold : 'transparent',
              color: postSubTab === 'new' ? '#000' : colors.textMuted,
              transition: 'background 0.2s, color 0.2s',
            }}>+ NEW JOB</button>

            <button onClick={() => setPostSubTab('manage')} aria-label="Manage Posted tab" style={{
              flex: 1, padding: '7px 16px', borderRadius: radii.sm, cursor: 'pointer', fontWeight: 700, fontSize: 11, border: 'none',
              background: postSubTab === 'manage' ? colors.gold : 'transparent',
              color: postSubTab === 'manage' ? '#000' : colors.textMuted,
              transition: 'background 0.2s, color 0.2s',
            }}>📋 MANAGE POSTED</button>
          </div>
        </div>
      </div>

      {postSubTab === 'new' ? (
        <NewJobForm newJob={newJob} setNewJob={setNewJob} onPost={onPost} loading={loading} isMobile={isMobile} />
      ) : (
        <div>
          {postedJobs.length === 0 ? (
            <div style={{ opacity: 0.7, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ marginBottom: 16 }}>No posted jobs yet &mdash; post your first job!</div>
              <button onClick={() => setPostSubTab('new')} style={{ background: colors.gold, color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: radii.md, cursor: 'pointer', fontSize: 12 }}>
                + NEW JOB
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 12 }}>
                <button onClick={() => setPostedViewMode('grid')} aria-label="Grid view" style={{ background: postedViewMode === 'grid' ? colors.gold : colors.bgElevated, color: postedViewMode === 'grid' ? '#000' : colors.textMuted, border: 'none', width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Grid view">▦</button>
                <button onClick={() => setPostedViewMode('list')} aria-label="List view" style={{ background: postedViewMode === 'list' ? colors.gold : colors.bgElevated, color: postedViewMode === 'list' ? '#000' : colors.textMuted, border: 'none', width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="List view">☰</button>
              </div>
              {postedViewMode === 'list' ? (
                <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radii.xl, overflow: 'hidden' }}>
                  {postedJobs.map((job, i) => (
                    <div key={job.id} style={{ borderBottom: i < postedJobs.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                      <PostedJobCard job={job} onRelease={onReleaseWorker} onDeactivate={onDeactivate} onDispute={onDispute} loading={loading} deactivating={deactivating} onEdit={onEditPostedJob} view={postedViewMode} myAddress={address} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="job-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: isMobile ? 12 : 20 }}>
                  {postedJobs.map(job => (
                    <PostedJobCard key={job.id} job={job} onRelease={onReleaseWorker} onDeactivate={onDeactivate} onDispute={onDispute} loading={loading} deactivating={deactivating} onEdit={onEditPostedJob} view={postedViewMode} myAddress={address} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editingPostedJob && (
        <div onClick={onCancelEdit} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} role="dialog" aria-modal="true" aria-label="Edit posted job">
          <div onClick={e => e.stopPropagation()} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, padding: 28, borderRadius: radii.xl, maxWidth: 480, width: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Edit Job</h3>
            <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 16 }}>Only display data changes. On-chain data (reward, escrow) stays the same.</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Title</div>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', borderRadius: radii.sm, fontSize: 12, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Job Type</div>
              <select value={editType} onChange={e => setEditType(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', borderRadius: radii.sm, fontSize: 12, boxSizing: 'border-box' }}>
                <option value="ML">Machine Learning</option>
                <option value="ZK">Zero Knowledge Proof</option>
                <option value="Render">Video / 3D Render</option>
                <option value="AI Inference">AI Inference</option>
                <option value="AI Training">AI Training</option>
                <option value="Data Labeling">Data Labeling</option>
                <option value="Video Transcoding">Video Transcoding</option>
                <option value="Scientific">Scientific Simulation</option>
                <option value="RAG Pipeline">RAG Pipeline</option>
                <option value="FHE">FHE Computation</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Difficulty</div>
              <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', borderRadius: radii.sm, fontSize: 12, boxSizing: 'border-box' }}>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Description</div>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', borderRadius: radii.sm, fontSize: 12, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Requirements</div>
              <textarea value={editReqs} onChange={e => setEditReqs(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', borderRadius: radii.sm, fontSize: 12, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Deadline</div>
              <input
                type="datetime-local"
                value={editDeadline ? editDeadline.slice(0, 16) : ''}
                onChange={e => setEditDeadline(e.target.value)}
                style={{ width: '100%', background: '#000', border: `1px solid ${editDeadlinePast ? colors.red : editDeadlineInvalid ? colors.orange : colors.border}`, padding: 10, color: '#c0d8e8', borderRadius: radii.sm, fontSize: 12, boxSizing: 'border-box' }}
              />
              {editDeadlinePast ? (
                <div style={{ fontSize: 9, color: '#ff6b6b', marginTop: 2 }}>Deadline must be in the future</div>
              ) : editDeadlineInvalid ? (
                <div style={{ fontSize: 9, color: '#f97316', marginTop: 2 }}>Invalid date format</div>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => onSaveEdit()} aria-label="Save edited job" style={{ flex: 1, padding: 12, background: colors.gold, color: '#000', fontWeight: 700, border: 'none', borderRadius: radii.md }}>SAVE</button>
              <button onClick={onCancelEdit} aria-label="Cancel editing" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.md }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewJobForm({ newJob, setNewJob, onPost, loading, isMobile }: {
  newJob: NewJobForm
  setNewJob: React.Dispatch<React.SetStateAction<NewJobForm>>
  onPost: () => void
  loading: boolean
  isMobile: boolean
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const flexRow = (gap = 12) => ({ display: 'flex', gap, flexDirection: isMobile ? 'column' as const : 'row' as const })

  const reward = isNaN(newJob.reward) ? 0 : newJob.reward
  const workers = isNaN(newJob.maxWorkers) ? 0 : newJob.maxWorkers
  const total = reward * workers
  const totalFormatted = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const deadlineMs = newJob.deadline ? Date.parse(newJob.deadline) : NaN
  const deadlineInvalid = newJob.deadline ? isNaN(deadlineMs) : false
  const deadlinePast = !deadlineInvalid && !isNaN(deadlineMs) && deadlineMs <= Date.now()
  const titleEmpty = !newJob.title.trim()
  const rewardZero = isNaN(newJob.reward) || newJob.reward <= 0
  const workersInvalid = isNaN(newJob.maxWorkers) || newJob.maxWorkers < 1
  const canSubmit = !titleEmpty && !rewardZero && !workersInvalid && !deadlinePast && !deadlineInvalid

  const update = (partial: Partial<NewJobForm>) => setNewJob((prev: NewJobForm) => ({ ...prev, ...partial }))
  const tokenColor = TOKEN_COLORS[newJob.token] || colors.gold
  const tokenSymbol = TOKEN_SYMBOLS[newJob.token] || 'zkLTC'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <form onSubmit={e => { e.preventDefault(); setTouched({ title: true, reward: true, workers: true }); if (!canSubmit) return; onPost() }} style={{ background: colors.bgCard, padding: 24, border: `1px solid ${colors.borderLight}`, borderRadius: radii.lg, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ ...flexRow(10), marginBottom: 14 }}>
          <div style={{ flex: isMobile ? 'none' : 1 }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Payment Token</div>
            <select
              value={newJob.token}
              onChange={e => update({ token: e.target.value as 'zkLTC' | 'USDC' | 'custom' })}
              aria-label="Payment token"
              style={{ width: '100%', background: '#000', border: `2px solid ${tokenColor}`, padding: 9, color: tokenColor, fontSize: 12, fontWeight: 700, borderRadius: radii.sm, cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="zkLTC" style={{ color: '#ffd700', background: '#000' }}>zkLTC (Native)</option>
              <option value="USDC" style={{ color: '#2775ca', background: '#000' }}>USDC</option>
              <option value="custom" disabled style={{ color: '#a855f7', background: '#000' }}>Your Coin — (Soon)</option>
            </select>
          </div>
          {newJob.token === 'custom' && (
            <div style={{ flex: isMobile ? 'none' : 1 }}>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Token Contract (CA)</div>
              <input
                placeholder="0x..."
                value={newJob.customToken || ''}
                onChange={e => update({ customToken: e.target.value })}
                style={{ width: '100%', background: '#000', border: '2px solid #a855f7', padding: 9, color: '#a855f7', fontSize: 12, borderRadius: radii.sm, boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

      {touched.title && titleEmpty && <div style={{ fontSize: 9, color: colors.red, marginBottom: 4 }}>Title is required</div>}
      <input placeholder="Job Title" maxLength={100} value={newJob.title} onChange={e => update({ title: e.target.value })} onBlur={() => setTouched(p => ({ ...p, title: true }))} aria-label="Job title" style={{ width: '100%', background: '#000', border: `1px solid ${touched.title && titleEmpty ? colors.red : colors.border}`, padding: 10, color: '#c0d8e8', marginBottom: 10, fontSize: 13, boxSizing: 'border-box', borderRadius: radii.sm }} />
      <textarea placeholder="Job Description" maxLength={500} value={newJob.description} onChange={e => update({ description: e.target.value })} aria-label="Job description" style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', marginBottom: 10, fontSize: 13, minHeight: 70, boxSizing: 'border-box', borderRadius: radii.sm, resize: 'none' }} />
      <textarea placeholder="Requirements (CPU/GPU/RAM)" maxLength={300} value={newJob.requirements} onChange={e => update({ requirements: e.target.value })} aria-label="Job requirements" style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', marginBottom: 10, fontSize: 13, minHeight: 70, boxSizing: 'border-box', borderRadius: radii.sm, resize: 'none' }} />
      <div style={{ ...flexRow(), marginBottom: 10 }}>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Job Type</div>
          <select
            value={newJob.type}
            onChange={e => update({ type: e.target.value })}
            aria-label="Job type"
            style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', fontSize: 12, boxSizing: 'border-box' }}>
            <option value="ML">Machine Learning</option>
            <option value="ZK">Zero Knowledge Proof</option>
            <option value="Render">Video / 3D Render</option>
            <option value="AI Inference">AI Inference</option>
            <option value="AI Training">AI Training</option>
            <option value="Data Labeling">Data Labeling</option>
            <option value="Video Transcoding">Video Transcoding</option>
            <option value="Scientific">Scientific Simulation</option>
            <option value="RAG Pipeline">RAG Pipeline</option>
            <option value="FHE">FHE Computation</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Difficulty</div>
          <select
            value={newJob.difficulty}
            onChange={e => update({ difficulty: e.target.value })}
            aria-label="Difficulty level"
            style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: '#c0d8e8', fontSize: 12, boxSizing: 'border-box' }}>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Reward Amount ({tokenSymbol})</div>
          {touched.reward && rewardZero && <div style={{ fontSize: 9, color: colors.red, marginBottom: 4 }}>Reward must be greater than 0</div>}
          <input type="number" step="0.01" min="0.01" required placeholder="e.g. 0.5" value={isNaN(newJob.reward) ? '' : newJob.reward} onChange={e => update({ reward: e.target.value === '' ? NaN : parseFloat(e.target.value) })} onBlur={() => setTouched(p => ({ ...p, reward: true }))} aria-label="Reward amount" style={{ width: '100%', background: '#000', border: `1px solid ${touched.reward && rewardZero ? colors.red : colors.border}`, padding: 10, color: '#c0d8e8', fontSize: 12, boxSizing: 'border-box', borderRadius: radii.sm }} />
        </div>
      </div>

      <div style={{ ...flexRow(), marginBottom: 14 }}>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Number of Workers</div>
          {touched.workers && workersInvalid && <div style={{ fontSize: 9, color: colors.red, marginBottom: 4 }}>At least 1 worker required</div>}
          <input type="number" min={1} max={100} required placeholder="e.g. 3" value={isNaN(newJob.maxWorkers) ? '' : newJob.maxWorkers} onChange={e => { const v = e.target.value.replace(/^0+/, ''); update({ maxWorkers: v === '' ? NaN : parseInt(v) || 1 }) }} onBlur={() => setTouched(p => ({ ...p, workers: true }))} aria-label="Number of workers" style={{ width: '100%', background: '#000', border: `1px solid ${touched.workers && workersInvalid ? colors.red : colors.border}`, padding: 10, color: '#c0d8e8', fontSize: 12, boxSizing: 'border-box', borderRadius: radii.sm }} />
        </div>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Deadline</div>
          <input
            type="datetime-local"
            value={newJob.deadline ? newJob.deadline.slice(0, 16) : ''}
            onChange={e => update({ deadline: e.target.value })}
            style={{ width: '100%', background: '#000', border: `1px solid ${deadlinePast ? colors.red : deadlineInvalid ? colors.orange : colors.border}`, padding: 10, color: '#c0d8e8', fontSize: 12, boxSizing: 'border-box' }}
          />
          {deadlinePast ? (
            <div style={{ fontSize: 9, color: '#ff6b6b', marginTop: 2 }}>Deadline must be in the future</div>
          ) : deadlineInvalid ? (
            <div style={{ fontSize: 9, color: '#f97316', marginTop: 2 }}>Invalid date format</div>
          ) : (
            <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>Pick a date & time — must be in the future</div>
          )}
        </div>
      </div>

      <button type="submit" disabled={loading || !canSubmit} aria-label="Post new job" style={{ width: '100%', background: loading || !canSubmit ? '#555' : tokenColor, color: '#000', border: 'none', padding: 12, fontSize: 13, fontWeight: 700, borderRadius: radii.md, cursor: loading || !canSubmit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spinner 0.6s linear infinite' }} />POSTING ON-CHAIN...</> : `POST JOB (${totalFormatted} ${tokenSymbol} total)`}
      </button>
      {!titleEmpty && reward > 0 && workers >= 1 && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, opacity: 0.5 }}>
          Escrow: {reward} {tokenSymbol} &times; {workers} worker = {totalFormatted} {tokenSymbol} held in contract
        </div>
      )}
    </form>
  </div>
  )
}