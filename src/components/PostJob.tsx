import { useState, useEffect } from 'react'
import type { Job, NewJobForm, PostSubTab } from '../types'
import { PostedJobCard } from './PostedJobCard'

type ViewMode = 'grid' | 'list'

const TOKEN_SYMBOLS: Record<string, string> = { zkLTC: 'zkLTC', USDC: 'USDC', custom: 'CUSTOM' }
const TOKEN_COLORS: Record<string, string> = { zkLTC: '#ffd700', USDC: '#2775ca', custom: '#a855f7' }

export function PostJob({ postSubTab, setPostSubTab, newJob, setNewJob, postedJobs, onPost, onReleaseWorker, onDeactivate, onDispute, loading, onEditPostedJob, editingPostedJob, editTitle, setEditTitle, editType, setEditType, editDesc, setEditDesc, editReqs, setEditReqs, editDeadline, setEditDeadline, onSaveEdit, onCancelEdit }: {
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
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [postedViewMode, setPostedViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
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
          <div style={{ display: 'flex', gap: 4, background: '#222', borderRadius: 8, padding: 4 }}>
            <button
              onClick={() => setPostSubTab('new')}
              aria-label="New job tab"
              style={{
                background: postSubTab === 'new' ? '#ffd700' : 'transparent',
                color: postSubTab === 'new' ? '#000' : '#888',
                border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}>
              + New Job
            </button>
            <button
              onClick={() => setPostSubTab('manage')}
              aria-label="Manage posted jobs tab"
              style={{
                background: postSubTab === 'manage' ? '#ffd700' : 'transparent',
                color: postSubTab === 'manage' ? '#000' : '#888',
                border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}>
              Manage Posted
            </button>
          </div>
        </div>
      </div>

      {postSubTab === 'new' ? (
        <NewJobForm newJob={newJob} setNewJob={setNewJob} onPost={onPost} loading={loading} />
      ) : (
        <div>
          {postedJobs.length === 0 ? (
            <div style={{ opacity: 0.7, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ marginBottom: 16 }}>No posted jobs yet &mdash; post your first job!</div>
              <button onClick={() => setPostSubTab('new')} style={{ background: '#ffd700', color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                + NEW JOB
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 12 }}>
                <button onClick={() => setPostedViewMode('grid')} aria-label="Grid view" style={{ background: postedViewMode === 'grid' ? '#ffd700' : '#222', color: postedViewMode === 'grid' ? '#000' : '#888', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Grid view">▦</button>
                <button onClick={() => setPostedViewMode('list')} aria-label="List view" style={{ background: postedViewMode === 'list' ? '#ffd700' : '#222', color: postedViewMode === 'list' ? '#000' : '#888', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="List view">☰</button>
              </div>
              <div style={postedViewMode === 'grid' ? { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: isMobile ? 12 : 20 } : { background: '#111', border: '1px solid #444', borderRadius: 12, overflow: 'hidden' }}>
                {postedJobs.map((job, i) => (
                  postedViewMode === 'list' ? (
                    <div key={job.id} style={{ borderBottom: i < postedJobs.length - 1 ? '1px solid #444' : 'none' }}>
                      <PostedJobCard key={job.id} job={job} onRelease={onReleaseWorker} onDeactivate={onDeactivate} onDispute={onDispute} loading={loading} onEdit={onEditPostedJob} view={postedViewMode} />
                    </div>
                  ) : (
                    <PostedJobCard key={job.id} job={job} onRelease={onReleaseWorker} onDeactivate={onDeactivate} onDispute={onDispute} loading={loading} onEdit={onEditPostedJob} view={postedViewMode} />
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {editingPostedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} role="dialog" aria-modal="true" aria-label="Edit posted job">
          <div style={{ background: '#111', border: '1px solid #444', padding: 28, borderRadius: 12, maxWidth: 480, width: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Edit Job</h3>
            <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 16 }}>Only display data changes. On-chain data (reward, escrow) stays the same.</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Title</div>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Job Type</div>
              <select value={editType} onChange={e => setEditType(e.target.value)} style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}>
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
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Description</div>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', borderRadius: 8, fontSize: 12, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Requirements</div>
              <textarea value={editReqs} onChange={e => setEditReqs(e.target.value)} style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', borderRadius: 8, fontSize: 12, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Deadline</div>
              <input
                type="datetime-local"
                value={editDeadline ? editDeadline.slice(0, 16) : ''}
                onChange={e => setEditDeadline(e.target.value)}
                style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => onSaveEdit()} aria-label="Save edited job" style={{ flex: 1, padding: 12, background: '#ffd700', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8 }}>SAVE</button>
              <button onClick={onCancelEdit} aria-label="Cancel editing" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: 8 }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewJobForm({ newJob, setNewJob, onPost, loading }: {
  newJob: NewJobForm
  setNewJob: React.Dispatch<React.SetStateAction<NewJobForm>>
  onPost: () => void
  loading: boolean
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const flexRow = (gap = 12) => ({ display: 'flex', gap, flexDirection: isMobile ? 'column' as const : 'row' as const })

  const reward = isNaN(newJob.reward) ? 0 : newJob.reward
  const workers = isNaN(newJob.maxWorkers) ? 0 : newJob.maxWorkers
  const total = reward * workers
  const totalFormatted = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const deadlineMs = newJob.deadline ? Date.parse(newJob.deadline) : NaN
  const deadlinePast = !isNaN(deadlineMs) && deadlineMs <= Date.now()

  const update = (partial: Partial<NewJobForm>) => setNewJob((prev: NewJobForm) => ({ ...prev, ...partial }))
  const tokenColor = TOKEN_COLORS[newJob.token] || '#ffd700'
  const tokenSymbol = TOKEN_SYMBOLS[newJob.token] || 'zkLTC'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <form onSubmit={e => { e.preventDefault(); onPost() }} style={{ background: '#111', padding: 24, border: '1px solid #333', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ ...flexRow(10), marginBottom: 14 }}>
          <div style={{ flex: isMobile ? 'none' : 1 }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Payment Token</div>
            <select
              value={newJob.token}
              onChange={e => update({ token: e.target.value as 'zkLTC' | 'USDC' | 'custom' })}
              aria-label="Payment token"
              style={{ width: '100%', background: '#000', border: `2px solid ${tokenColor}`, padding: 9, color: tokenColor, fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', boxSizing: 'border-box' }}>
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
                style={{ width: '100%', background: '#000', border: '2px solid #a855f7', padding: 9, color: '#a855f7', fontSize: 12, borderRadius: 8, boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

      <input placeholder="Job Title" value={newJob.title} onChange={e => update({ title: e.target.value })} aria-label="Job title" style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', marginBottom: 10, fontSize: 13, boxSizing: 'border-box' }} />
      <textarea placeholder="Job Description" value={newJob.description} onChange={e => update({ description: e.target.value })} aria-label="Job description" style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', marginBottom: 10, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
      <textarea placeholder="Requirements (CPU/GPU/RAM)" value={newJob.requirements} onChange={e => update({ requirements: e.target.value })} aria-label="Job requirements" style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', marginBottom: 10, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
      <div style={{ ...flexRow(), marginBottom: 10 }}>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Job Type</div>
          <select
            value={newJob.type}
            onChange={e => update({ type: e.target.value })}
            aria-label="Job type"
            style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', fontSize: 12, boxSizing: 'border-box' }}>
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
            style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', fontSize: 12, boxSizing: 'border-box' }}>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Reward Amount ({tokenSymbol})</div>
          <input type="number" step="0.01" min="0.01" required placeholder="e.g. 0.5" value={isNaN(newJob.reward) ? '' : newJob.reward} onChange={e => update({ reward: e.target.value === '' ? NaN : parseFloat(e.target.value) })} aria-label="Reward amount" style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', fontSize: 12, boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ ...flexRow(), marginBottom: 14 }}>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Number of Workers</div>
          <input type="number" min={1} max={100} required placeholder="e.g. 3" value={isNaN(newJob.maxWorkers) ? '' : newJob.maxWorkers} onChange={e => { const v = e.target.value.replace(/^0+/, ''); update({ maxWorkers: v === '' ? NaN : parseInt(v) || 1 }) }} aria-label="Number of workers" style={{ width: '100%', background: '#000', border: '1px solid #444', padding: 10, color: '#fff', fontSize: 12, boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: isMobile ? 'none' : 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Deadline</div>
          <input
            type="datetime-local"
            value={newJob.deadline ? newJob.deadline.slice(0, 16) : ''}
            onChange={e => update({ deadline: e.target.value })}
            style={{ width: '100%', background: '#000', border: `1px solid ${deadlinePast ? '#ff6b6b' : '#444'}`, padding: 10, color: '#fff', fontSize: 12, boxSizing: 'border-box' }}
          />
          {deadlinePast ? (
            <div style={{ fontSize: 9, color: '#ff6b6b', marginTop: 2 }}>Deadline must be in the future</div>
          ) : (
            <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>Pick a date & time — must be in the future</div>
          )}
        </div>
      </div>

      <button type="submit" disabled={loading} aria-label="Post new job" style={{ width: '100%', background: loading ? '#666' : tokenColor, color: '#000', border: 'none', padding: 12, fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'POSTING ON-CHAIN...' : `POST JOB (${totalFormatted} ${tokenSymbol} total)`}
      </button>
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, opacity: 0.5 }}>
        Escrow: {reward} {tokenSymbol} &times; {workers} worker = {totalFormatted} {tokenSymbol} held in contract
      </div>
    </form>
  </div>
  )
}