import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../types'
import { getDeadlineMs, formatTimeRemaining, formatDeadlineDate, COUNTDOWN_REFRESH } from '../utils'

const JOB_TYPE_ICONS: Record<string, string> = {
  ML: '🧠', ZK: '🔐', Render: '🎬', 'AI Inference': '🤖',
  'AI Training': '🏋️', 'Data Labeling': '🏷️', 'Video Transcoding': '🎥',
  Scientific: '🔬', 'RAG Pipeline': '🔗', FHE: '🔒', Custom: '⚙️',
}

type ViewMode = 'grid' | 'list'

export function MyJobs({ myJobs, address, onOpenProof, onUnclaim, onRelease, loading, onDispute, onResolveDispute }: {
  myJobs: Job[]
  address: string | undefined
  onOpenProof: (job: Job) => void
  onUnclaim: (jobId: number) => void
  onRelease: (job: Job) => void
  loading: boolean
  onDispute: (job: Job, worker?: string) => void
  onResolveDispute: (job: Job, acceptCancel: boolean) => void
}) {
  const [now, setNow] = useState(Date.now())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const navigate = useNavigate()

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setNow(Date.now())
    }, COUNTDOWN_REFRESH)
    return () => clearInterval(id)
  }, [])

  if (myJobs.length === 0) {
    return (
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 24 }}>My Jobs</h2>
        <div style={{ opacity: 0.7, padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👷</div>
          <div style={{ marginBottom: 16 }}>No jobs claimed yet &mdash; browse the marketplace to find work!</div>
          <button onClick={() => navigate('/')} style={{ background: '#ffd700', color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
            BROWSE MARKETPLACE
          </button>
        </div>
      </div>
    )
  }

  const activeJobs = myJobs.filter(j => j.status === 'claimed')
  const completedJobs = myJobs.filter(j => j.status === 'completed')
  const disputedJobs = myJobs.filter(j => j.status === 'disputed')
  const paidJobs = myJobs.filter(j => j.status === 'paid')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>My Jobs</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setViewMode('grid')} aria-label="Grid view" style={{ background: viewMode === 'grid' ? '#ffd700' : '#222', color: viewMode === 'grid' ? '#000' : '#888', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Grid view">▦</button>
          <button onClick={() => setViewMode('list')} aria-label="List view" style={{ background: viewMode === 'list' ? '#ffd700' : '#222', color: viewMode === 'list' ? '#000' : '#888', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="List view">☰</button>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: '#ffd700', borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6 }}>In Progress ({activeJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode}>
            {activeJobs.map((job, i) => (
              <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < activeJobs.length - 1 ? '1px solid #444' : 'none' } : {}}>
                <JobCard_ job={job} now={now} viewMode={viewMode}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onOpenProof(job)} aria-label={`Submit proof for ${job.title}`} style={{ flex: 1, background: '#ffd700', color: '#000', border: 'none', padding: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}>SUBMIT PROOF</button>
                    <button onClick={() => onUnclaim(job.id)} aria-label={`Unclaim ${job.title}`} style={{ flex: 1, background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer' }}>UNCLAIM</button>
                  </div>
                </JobCard_>
              </div>
            ))}
          </JobsContainer>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: '#4ade80', borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6 }}>Proof Submitted &mdash; Awaiting Payment ({completedJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode}>
            {completedJobs.map((job, i) => {
              const isPoster = address?.toLowerCase() === job.poster.toLowerCase()
              const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              const listEl = listLayout(job, rewardStr, now)
              return (
                <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < completedJobs.length - 1 ? '1px solid #444' : 'none' } : {}}>
                  {viewMode === 'list' ? (
                    <div style={listRowStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        {listEl}{sep()}
                        {isPoster ? (
                          <button onClick={() => onRelease(job)} disabled={loading} style={{ whiteSpace: 'nowrap', background: '#4ade80', color: '#000', border: 'none', padding: '4px 10px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 10 }}>RELEASE</button>
                        ) : (
                          <span style={{ whiteSpace: 'nowrap', fontSize: 10, opacity: 0.5 }}>Awaiting release</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={cardStyle(false)}>
                      <CardHeader job={job} now={now} />
                      <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
                      {isPoster ? (
                        <button onClick={() => onRelease(job)} disabled={loading} aria-label={`Release payment for ${job.title}`} style={{ width: '100%', background: '#4ade80', color: '#000', border: 'none', padding: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', marginBottom: 8 }}>
                          {loading ? 'PROCESSING...' : `RELEASE PAYMENT (+${rewardStr} ${job.tokenSymbol || 'zkLTC'})`}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ background: '#2a2a1a', color: '#ffd700', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11 }}>
                            WAITING FOR POSTER TO RELEASE
                          </div>
                          <button onClick={() => onOpenProof(job)} aria-label={`Resubmit proof for ${job.title}`} style={{ background: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '8px 12px', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                            RESUBMIT PROOF
                          </button>
                          <button onClick={() => onDispute(job)} aria-label={`File dispute for ${job.title}`} style={{ background: 'transparent', color: '#f97316', border: '1px solid #f97316', padding: '8px 12px', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                            FILE DISPUTE (Non-Payment)
                          </button>
                        </div>
                      )}
                      <div style={{ background: '#1a3c1a', color: '#4ade80', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11, marginTop: 8 }}>
                        PROOF SUBMITTED &mdash; AWAITING PAYMENT
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </JobsContainer>
        </div>
      )}

      {disputedJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: '#f97316', borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6, color: '#f97316' }}>Disputed ({disputedJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode}>
            {disputedJobs.map((job, i) => {
              const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              return (
                <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < disputedJobs.length - 1 ? '1px solid #444' : 'none' } : {}}>
                  {viewMode === 'list' ? (
                    <div style={listRowStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        {listLayout(job, rewardStr, now)}{sep()}
                        <span style={{ color: '#f97316', fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>DISPUTED</span>
                        <button onClick={() => onResolveDispute(job, true)} style={{ background: '#f97316', color: '#000', border: 'none', padding: '3px 8px', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 10 }}>ACCEPT</button>
                        <button onClick={() => onResolveDispute(job, false)} style={{ background: 'transparent', color: '#4ade80', border: '1px solid #4ade80', padding: '3px 8px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontSize: 10 }}>REJECT</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ ...cardStyle(false), border: '1px solid #f97316' }}>
                      <CardHeader job={job} now={now} />
                      <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
                      <div style={{ background: '#2a1a0a', color: '#f97316', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11, marginBottom: 8 }}>
                        DISPUTE ACTIVE
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => onResolveDispute(job, true)} aria-label={`Accept cancellation for ${job.title}`} style={{ flex: 1, padding: 10, background: '#f97316', color: '#000', border: 'none', fontWeight: 700, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                          ACCEPT CANCEL
                        </button>
                        <button onClick={() => onResolveDispute(job, false)} aria-label={`Reject cancellation for ${job.title}`} style={{ flex: 1, padding: 10, background: 'transparent', color: '#4ade80', border: '1px solid #4ade80', fontWeight: 600, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                          REJECT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </JobsContainer>
        </div>
      )}

      {paidJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: '#4ade80', borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6 }}>Paid ({paidJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode}>
            {paidJobs.map((job, i) => {
              const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              return (
                <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < paidJobs.length - 1 ? '1px solid #444' : 'none' } : {}}>
                  {viewMode === 'list' ? (
                    <div style={listRowStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        {listLayout(job, rewardStr, now)}{sep()}
                        <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>PAID</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ ...cardStyle(false), opacity: 0.85 }}>
                      <CardHeader job={job} now={now} />
                      <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
                      <div style={{ background: '#1a3c1a', color: '#4ade80', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600 }}>PAID</div>
                    </div>
                  )}
                </div>
              )
            })}
          </JobsContainer>
        </div>
      )}
    </div>
  )
}

function cardStyle(active: boolean): React.CSSProperties {
  return {
    background: '#111',
    border: active ? '1px solid #ffd700' : '1px solid #333',
    borderRadius: 12,
    padding: 24,
  }
}

function listRowStyle(): React.CSSProperties {
  return {
    padding: '10px 16px',
    width: '100%',
    boxSizing: 'border-box',
  }
}

function JobsContainer({ viewMode, children }: { viewMode: ViewMode; children: React.ReactNode }) {
  return viewMode === 'grid' ? (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      {children}
    </div>
  ) : (
    <div style={{ background: '#111', border: '1px solid #444', borderRadius: 12, overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function CardHeader({ job, now }: { job: Job; now: number }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{job.title}</div>
        <div style={{ background: '#333', color: '#ffd700', padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{JOB_TYPE_ICONS[job.type] || '📋'} {job.type}</div>
      </div>
      <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>
        Deadline: <CountdownValue createdAt={job.createdAt} deadline={job.deadline} now={now} />
      </div>
    </>
  )
}

function sep() {
  return <div style={{ width: 1, height: 22, background: '#444', flexShrink: 0 }} />
}

function listLayout(job: Job, rewardStr: string, now: number): React.ReactNode {
  const deadlineEl = <CountdownValue createdAt={job.createdAt} deadline={job.deadline} now={now} />
  const s = sep()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, flex: '1 1 160px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
      {s}
      <div style={{ flex: '0 0 80px', color: '#ffd700', fontSize: 11, fontWeight: 600 }}>{JOB_TYPE_ICONS[job.type] || '📋'} {job.type}</div>
      {s}
      <div style={{ color: '#ffd700', fontWeight: 600, flex: '0 0 120px', whiteSpace: 'nowrap' }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
      {s}
      <div style={{ opacity: 0.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deadlineEl}</div>
    </div>
  )
}

function CountdownValue({ createdAt, deadline, now }: { createdAt?: number; deadline: string; now: number }) {
  const endMs = getDeadlineMs(createdAt, deadline)
  if (endMs === null) return <span style={{ opacity: 0.5 }}>{deadline}</span>
  const remaining = endMs - now
  if (remaining <= 0) return <span style={{ color: '#ff6b6b' }}>{formatDeadlineDate(createdAt, deadline)} (expired)</span>
  if (remaining < 3600000) return <span style={{ color: '#f97316' }}>{formatDeadlineDate(createdAt, deadline)} ({formatTimeRemaining(remaining)} left)</span>
  return <span style={{ color: '#777' }}>{formatDeadlineDate(createdAt, deadline)} ({formatTimeRemaining(remaining)} left)</span>
}

function JobCard_({ job, now, children, viewMode }: { job: Job; now: number; children: React.ReactNode; viewMode: ViewMode }) {
  const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const s = sep()
  return viewMode === 'list' ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, flex: '1 1 160px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
      {s}
      <div style={{ flex: '0 0 80px', color: '#ffd700', fontSize: 11, fontWeight: 600 }}>{JOB_TYPE_ICONS[job.type] || '📋'} {job.type}</div>
      {s}
      <div style={{ color: '#ffd700', fontWeight: 600, flex: '0 0 120px', whiteSpace: 'nowrap' }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
      {s}
      <div style={{ opacity: 0.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <CountdownValue createdAt={job.createdAt} deadline={job.deadline} now={now} />
      </div>
      {s}
      <div style={{ display: 'flex', gap: 4 }}>
        {children}
      </div>
    </div>
  ) : (
    <div style={cardStyle(true)}>
      <CardHeader job={job} now={now} />
      <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
      {children}
    </div>
  )
}
