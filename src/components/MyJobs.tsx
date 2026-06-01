import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../types'
import { getDeadlineMs, formatTimeRemaining, formatDeadlineDate, COUNTDOWN_REFRESH } from '../utils'
import { colors, radii } from '../styles/tokens'

const JOB_TYPE_ICONS: Record<string, string> = {
  ML: '🧠', ZK: '🔐', Render: '🎬', 'AI Inference': '🤖',
  'AI Training': '🏋️', 'Data Labeling': '🏷️', 'Video Transcoding': '🎥',
  Scientific: '🔬', 'RAG Pipeline': '🔗', FHE: '🔒', Custom: '⚙️',
}

type ViewMode = 'grid' | 'list'

export function MyJobs({ myJobs, address, onOpenProof, onUnclaim, onRelease, loading, submittingProof, releasing, onDispute, onResolveDispute }: {
  myJobs: Job[]
  address?: string
  onOpenProof: (job: Job) => void
  onUnclaim: (jobId: number) => void
  onRelease: (job: Job) => void
  loading: boolean
  submittingProof?: boolean
  releasing?: boolean
  onDispute: (job: Job, worker?: string) => void
  onResolveDispute: (job: Job, acceptCancel: boolean) => void
}) {
  const [now, setNow] = useState(Date.now())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

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
          <button type="button" onClick={() => navigate('/')} style={{ background: colors.gold, color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: radii.sm, cursor: 'pointer', fontSize: 12 }}>
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
          <button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode === 'grid'} style={{ background: viewMode === 'grid' ? colors.gold : colors.bgElevated, color: viewMode === 'grid' ? '#000' : colors.textMuted, border: 'none', width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Grid view">▦</button>
          <button type="button" onClick={() => setViewMode('list')} aria-label="List view" aria-pressed={viewMode === 'list'} style={{ background: viewMode === 'list' ? colors.gold : colors.bgElevated, color: viewMode === 'list' ? '#000' : colors.textMuted, border: 'none', width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="List view">☰</button>
        </div>
      </div>

      {activeJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: colors.gold, borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6 }}>In Progress ({activeJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode} isMobile={isMobile} isTablet={isTablet}>
            {activeJobs.map((job, i) => (
              <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < activeJobs.length - 1 ? `1px solid ${colors.border}` : 'none' } : {}}>
                <JobCard_ job={job} now={now} viewMode={viewMode} isMobile={isMobile}>
                  <div style={{ display: 'flex', gap: 8, flexDirection: isMobile && viewMode === 'grid' ? 'column' : 'row' }}>
                    <button type="button" onClick={() => onOpenProof(job)} disabled={submittingProof} aria-label={`Submit proof for ${job.title}`} style={{ flex: 1, background: submittingProof ? '#555' : colors.gold, color: '#000', border: 'none', padding: 12, fontWeight: 700, borderRadius: radii.sm, cursor: submittingProof ? 'not-allowed' : 'pointer', opacity: submittingProof ? 0.5 : 1 }}>{submittingProof ? 'SUBMITTING...' : 'SUBMIT PROOF'}</button>
                    <button type="button" onClick={() => onUnclaim(job.id)} disabled={submittingProof} aria-label={`Unclaim ${job.title}`} style={{ flex: 1, background: 'transparent', color: colors.red, border: `1px solid ${colors.red}`, padding: 12, fontWeight: 600, borderRadius: radii.sm, cursor: submittingProof ? 'not-allowed' : 'pointer', opacity: submittingProof ? 0.4 : 1 }}>UNCLAIM</button>
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
            <div style={{ width: 3, height: 16, background: colors.green, borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6 }}>Proof Submitted &mdash; Awaiting Payment ({completedJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode} isMobile={isMobile} isTablet={isTablet}>
            {completedJobs.map((job, i) => {
              const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              const listEl = listLayout(job, rewardStr, now)
              return (
                <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < completedJobs.length - 1 ? `1px solid ${colors.border}` : 'none' } : {}}>
                  {viewMode === 'list' ? (
                    <div style={listRowStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        {listEl}{sep()}
                        <span style={{ whiteSpace: 'nowrap', fontSize: 10, opacity: 0.5 }}>AWAITING RELEASE</span>
                      </div>
                    </div>
                  ) : (
                    <div className="job-card" style={cardStyle(false, isMobile)}>
                      <CardHeader job={job} now={now} />
                      <div style={{ margin: isMobile ? '12px 0' : '16px 0', fontSize: 20, color: colors.gold, fontWeight: 700 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
                      <div style={{ background: '#1a3c1a', color: colors.green, padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11, marginBottom: 8 }}>
                        PROOF SUBMITTED &mdash; AWAITING PAYMENT
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button type="button" onClick={() => onOpenProof(job)} aria-label={`Resubmit proof for ${job.title}`} style={{ background: 'transparent', color: colors.blue, border: `1px solid ${colors.blue}`, padding: '8px 12px', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                          RESUBMIT PROOF
                        </button>
                        <button type="button" onClick={() => onDispute(job)} aria-label={`File dispute for ${job.title}`} style={{ background: 'transparent', color: colors.orange, border: `1px solid ${colors.orange}`, padding: '8px 12px', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                          FILE DISPUTE (Non-Payment)
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

      {disputedJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: colors.orange, borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6, color: colors.orange }}>Disputed ({disputedJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode} isMobile={isMobile} isTablet={isTablet}>
            {disputedJobs.map((job, i) => {
              const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              return (
                <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < disputedJobs.length - 1 ? `1px solid ${colors.border}` : 'none' } : {}}>
                  {viewMode === 'list' ? (
                    <div style={listRowStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        {listLayout(job, rewardStr, now)}{sep()}
                        <span style={{ color: colors.orange, fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>DISPUTED</span>
                        <button type="button" onClick={() => onResolveDispute(job, true)} disabled={loading} style={{ background: loading ? '#555' : colors.orange, color: '#000', border: 'none', padding: '3px 8px', borderRadius: radii.sm, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 10, opacity: loading ? 0.5 : 1 }} title="Accept cancellation — job removed, you lose your claim">ACCEPT</button>
                        <button type="button" onClick={() => onResolveDispute(job, false)} disabled={loading} style={{ background: 'transparent', color: colors.green, border: `1px solid ${colors.green}`, padding: '3px 8px', borderRadius: radii.sm, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 10, opacity: loading ? 0.4 : 1 }} title="Reject cancellation — dispute sent for on-chain resolution">REJECT</button>
                      </div>
                    </div>
                  ) : (
                    <div className="job-card" style={{ ...cardStyle(false, isMobile), border: `1px solid ${colors.orange}` }}>
                      <CardHeader job={job} now={now} />
                      <div style={{ margin: isMobile ? '12px 0' : '16px 0', fontSize: 20, color: colors.gold, fontWeight: 700 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
                      <div style={{ background: '#2a1a0a', color: colors.orange, padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11, marginBottom: 8 }}>
                        DISPUTE ACTIVE
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                        <button type="button" onClick={() => onResolveDispute(job, true)} disabled={loading} aria-label={`Accept cancellation for ${job.title}`} style={{ flex: 1, padding: 10, background: loading ? '#555' : colors.orange, color: '#000', border: 'none', fontWeight: 700, borderRadius: radii.sm, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, opacity: loading ? 0.5 : 1 }} title="Accept cancellation — job removed, you lose your claim">
                          ACCEPT CANCEL
                        </button>
                        <button type="button" onClick={() => onResolveDispute(job, false)} disabled={loading} aria-label={`Reject cancellation for ${job.title}`} style={{ flex: 1, padding: 10, background: 'transparent', color: colors.green, border: `1px solid ${colors.green}`, fontWeight: 600, borderRadius: radii.sm, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, opacity: loading ? 0.4 : 1 }} title="Reject cancellation — dispute sent for on-chain resolution">
                          REJECT CANCEL
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
            <div style={{ width: 3, height: 16, background: colors.green, borderRadius: 2 }} />
            <div style={{ fontSize: 12, opacity: 0.6 }}>Paid ({paidJobs.length})</div>
          </div>
          <JobsContainer viewMode={viewMode} isMobile={isMobile} isTablet={isTablet}>
            {paidJobs.map((job, i) => {
              const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              return (
                <div key={job.id} style={viewMode === 'list' ? { borderBottom: i < paidJobs.length - 1 ? `1px solid ${colors.border}` : 'none' } : {}}>
                  {viewMode === 'list' ? (
                    <div style={listRowStyle()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        {listLayout(job, rewardStr, now)}{sep()}
                        <span style={{ color: colors.green, fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>✅ PAID (+{rewardStr} {job.tokenSymbol || 'zkLTC'})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="job-card" style={cardStyle(false, isMobile)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.8 }}>{job.title}</div>
                        <div style={{ background: colors.borderLight, color: colors.gold, padding: '2px 10px', borderRadius: radii.full, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{JOB_TYPE_ICONS[job.type] || '📋'} {job.type}</div>
                      </div>
                      <div style={{ margin: isMobile ? '12px 0' : '16px 0', fontSize: 20, color: colors.green, fontWeight: 700 }}>+{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
                      <div style={{ background: '#1a3c1a', color: colors.green, padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600 }}>✅ PAID</div>
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

function cardStyle(active: boolean, isMobile?: boolean, expired?: boolean): React.CSSProperties {
  let borderColor = colors.borderLight
  if (expired) borderColor = colors.red
  else if (active) borderColor = colors.gold
  return {
    background: colors.bgCard,
    border: `1px solid ${borderColor}`,
    borderRadius: radii.xl,
    padding: isMobile ? 16 : 24,
  }
}

function listRowStyle(): React.CSSProperties {
  return {
    padding: '10px 16px',
    width: '100%',
    boxSizing: 'border-box',
  }
}

function JobsContainer({ viewMode, children, isMobile, isTablet }: { viewMode: ViewMode; children: React.ReactNode; isMobile: boolean; isTablet?: boolean }) {
  return viewMode === 'grid' ? (
    <div className="job-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: isMobile ? 12 : 20 }}>
      {children}
    </div>
  ) : (
    <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radii.xl, overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function CardHeader({ job, now }: { job: Job; now: number }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{job.title}</div>
        <div style={{ background: colors.borderLight, color: colors.gold, padding: '2px 10px', borderRadius: radii.full, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{JOB_TYPE_ICONS[job.type] || '📋'} {job.type}</div>
      </div>
      <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>
        Deadline: <CountdownValue createdAt={job.createdAt} deadline={job.deadline} now={now} />
      </div>
    </>
  )
}

function sep() {
  return <div style={{ width: 1, height: 22, background: colors.border, flexShrink: 0 }} />
}

function listLayout(job: Job, rewardStr: string, now: number): React.ReactNode {
  const deadlineEl = <CountdownValue createdAt={job.createdAt} deadline={job.deadline} now={now} />
  const s = sep()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, flex: '1 1 160px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
      {s}
      <div style={{ flex: '0 0 80px', color: colors.gold, fontSize: 11, fontWeight: 600 }}>{JOB_TYPE_ICONS[job.type] || '📋'} {job.type}</div>
      {s}
      <div style={{ color: colors.gold, fontWeight: 600, flex: '0 0 120px', whiteSpace: 'nowrap' }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
      {s}
      <div style={{ opacity: 0.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deadlineEl}</div>
    </div>
  )
}

function CountdownValue({ createdAt, deadline, now }: { createdAt?: number; deadline: string; now: number }) {
  const endMs = getDeadlineMs(createdAt, deadline)
  if (endMs === null) return <span style={{ opacity: 0.5 }}>{deadline}</span>
  const remaining = endMs - now
  if (remaining <= 0) return <span style={{ color: colors.red }}>{formatDeadlineDate(createdAt, deadline)} (expired)</span>
  if (remaining < 3600000) return <span style={{ color: colors.orange }}>{formatDeadlineDate(createdAt, deadline)} ({formatTimeRemaining(remaining)} left)</span>
  return <span style={{ color: colors.textDim }}>{formatDeadlineDate(createdAt, deadline)} ({formatTimeRemaining(remaining)} left)</span>
}

function JobCard_({ job, now, children, viewMode, isMobile }: { job: Job; now: number; children: React.ReactNode; viewMode: ViewMode; isMobile?: boolean }) {
  const rewardStr = job.reward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const endMs = getDeadlineMs(job.createdAt, job.deadline)
  const expired = endMs !== null && endMs <= now
  const s = sep()
  return viewMode === 'list' ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 12, overflowX: 'auto', opacity: expired ? 0.65 : 1 }}>
      <div style={{ fontWeight: 700, flex: '1 1 160px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}{expired ? ' (expired)' : ''}</div>
      {s}
      <div style={{ flex: '0 0 80px', color: colors.gold, fontSize: 11, fontWeight: 600 }}>{JOB_TYPE_ICONS[job.type] || '📋'} {job.type}</div>
      {s}
      <div style={{ color: colors.gold, fontWeight: 600, flex: '0 0 120px', whiteSpace: 'nowrap' }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
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
    <div className="job-card" style={cardStyle(true, isMobile, expired)}>
      <CardHeader job={job} now={now} />
      <div style={{ margin: isMobile ? '12px 0' : '16px 0', fontSize: 20, color: colors.gold, fontWeight: 700, opacity: expired ? 0.6 : 1 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
      {children}
    </div>
  )
}
