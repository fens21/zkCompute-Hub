import { useState, useEffect } from 'react'
import type { Job, SortBy } from '../types'
import { shorten, getDeadlineMs, formatTimeRemaining, formatDeadlineDate, COUNTDOWN_REFRESH } from '../utils'
import { colors, radii, fontSizes, card, input } from '../styles/tokens'
import { useIsMobile } from '../hooks/useIsMobile'
import { JOB_TYPE_CONFIGS } from '../constants/jobTypes'

const PER_PAGE = 12
type ViewMode = 'grid' | 'list'

export function Marketplace({ jobs, search, setSearch, typeFilter, setTypeFilter, sortBy, setSortBy, onClaim, onDetail, claimingJobId, jobsLoading, jobsError, onRetry }: {
  jobs: Job[]
  search: string
  setSearch: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  sortBy: SortBy
  setSortBy: (v: SortBy) => void
  onClaim: (job: Job) => void
  onDetail: (job: Job) => void
  claimingJobId?: number | null
  jobsLoading?: boolean
  jobsError?: string | null
  onRetry?: () => void
}) {
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [dismissed, setDismissed] = useState(false)
  const isMobile = useIsMobile()

  const totalPages = Math.max(1, Math.ceil(jobs.length / PER_PAGE))
  const pagedJobs = jobs.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const hasMore = page < totalPages

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, sortBy, jobs.length])

  // Grid columns: 2 kolom di mobile (1 kolom di HP kecil), auto-fill di desktop
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isTiny = windowWidth < 420
  const gridCols = isMobile && !isTiny ? 'repeat(2, 1fr)' : isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))'

  return (
    <>
      {!dismissed && (() => {
        const now = Date.now()
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000
        const activeJobs = jobs.filter(j => {
          if (!j.createdAt || now - j.createdAt > TWO_DAYS_MS) return false
          const endMs = getDeadlineMs(j.createdAt, j.deadline)
          return endMs !== null && endMs > now && j.claimedCount < j.maxWorkers
        })
        const recentJobs = activeJobs.slice(-5).reverse()
        return recentJobs.length > 0 ? <JobCarousel jobs={recentJobs} onDetail={onDetail} onClose={() => setDismissed(true)} /> : null
      })()}

      <div style={{ textAlign: 'center', marginBottom: isMobile ? 16 : 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : fontSizes.heading, margin: 0, color: colors.textPrimary, lineHeight: 1.3 }}>
          Verifiable Compute Marketplace
        </h1>
        <p style={{ opacity: 0.7, marginTop: 4, fontSize: fontSizes.base }}>Earn zkLTC by running verified compute jobs</p>
      </div>

      {/* Filter bar - stack vertically di mobile */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: isMobile ? 8 : 10,
      }}>
        <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
          <button onClick={() => setViewMode('grid')} aria-label="Grid view" style={{ background: viewMode === 'grid' ? colors.gold : '#222', color: viewMode === 'grid' ? '#000' : '#888', border: 'none', width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.lg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Grid view">▦</button>
          <button onClick={() => setViewMode('list')} aria-label="List view" style={{ background: viewMode === 'list' ? colors.gold : '#222', color: viewMode === 'list' ? '#000' : '#888', border: 'none', width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.lg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="List view">[]</button>
        </div>
        {/* Di mobile: search full width di baris sendiri */}
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search jobs"
          style={{ ...input, width: isMobile ? '100%' : 200, flexBasis: isMobile ? '100%' : 'auto', order: isMobile ? 3 : 0, boxSizing: 'border-box' as const }}
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          aria-label="Filter by job type"
          style={{ ...input, flex: isMobile ? '1' : 'none', minWidth: 0, boxSizing: 'border-box' as const }}
        >
          <option value="">All Types</option>
          <option value="ML">ML</option>
          <option value="ZK">ZK Proof</option>
          <option value="Render">Render</option>
          <option value="AI Inference">AI Inference</option>
          <option value="AI Training">AI Training</option>
          <option value="Scientific">Scientific</option>
          <option value="Data Labeling">Data Labeling</option>
          <option value="Video Transcoding">Transcoding</option>
          <option value="RAG Pipeline">RAG Pipeline</option>
          <option value="FHE">FHE</option>
          <option value="Custom">Custom</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          aria-label="Sort jobs"
          style={{ ...input, flex: isMobile ? '1' : 'none', minWidth: 0, boxSizing: 'border-box' as const }}
        >
          <option value="reward">Sort: Reward</option>
          <option value="deadline">Sort: Deadline</option>
        </select>
      </div>

      {jobsLoading && jobs.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 12 : 20 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonJobCard key={i} />)}
        </div>
      ) : jobsError ? (
        <div style={{ textAlign: 'center', padding: 60, background: colors.bgCard, border: `1px solid ${colors.red}`, borderRadius: radii.xl }}>
          <div style={{ opacity: 0.7, fontSize: fontSizes.md, marginBottom: 16 }}>{jobsError}</div>
          {onRetry && (
            <button onClick={onRetry} style={{ background: colors.gold, color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: radii.sm, cursor: 'pointer' }}>
              RETRY
            </button>
          )}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', opacity: 0.7, padding: 60, fontSize: fontSizes.md }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            {search || typeFilter ? '🔍 Search' : 'No Jobs'}
          </div>
          {search || typeFilter
            ? 'No jobs match your search criteria — try adjusting your filters.'
            : 'No jobs available — be the first to post one!'}
        </div>
      ) : (
        <>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: page <= 1 ? colors.bgCard : colors.bgElevated, border: `1px solid ${colors.borderLight}`, color: page <= 1 ? '#555' : '#ccc', padding: '4px 12px', borderRadius: radii.sm, cursor: page <= 1 ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600 }}>Prev</button>
              <span style={{ fontSize: fontSizes.base, opacity: 0.6 }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!hasMore} style={{ background: !hasMore ? colors.bgCard : colors.bgElevated, border: `1px solid ${colors.borderLight}`, color: !hasMore ? '#555' : '#ccc', padding: '4px 12px', borderRadius: radii.sm, cursor: !hasMore ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600 }}>Next</button>
            </div>
          )}
          {viewMode === 'list' ? (
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radii.xl, overflow: 'hidden' }}>
              {pagedJobs.map((job, i) => (
                <div key={job.id} className="job-card-list-row" style={{ borderBottom: i < pagedJobs.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <JobCardList job={job} onClaim={onClaim} onDetail={onDetail} claimingJobId={claimingJobId} isMobile={isMobile} />
                </div>
              ))}
            </div>
          ) : (
            <div key={`${search}-${typeFilter}-${sortBy}`} className="job-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 10 : 16 }}>
              {pagedJobs.map(job => (
                <JobCard key={job.id} job={job} onClaim={onClaim} onDetail={onDetail} claimingJobId={claimingJobId} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: page <= 1 ? colors.bgCard : colors.bgElevated, border: `1px solid ${colors.borderLight}`, color: page <= 1 ? '#555' : '#ccc', padding: '4px 12px', borderRadius: radii.sm, cursor: page <= 1 ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600 }}>Prev</button>
              <span style={{ fontSize: fontSizes.base, opacity: 0.6 }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!hasMore} style={{ background: !hasMore ? colors.bgCard : colors.bgElevated, border: `1px solid ${colors.borderLight}`, color: !hasMore ? '#555' : '#ccc', padding: '4px 12px', borderRadius: radii.sm, cursor: !hasMore ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600 }}>Next</button>
            </div>
          )}
        </>
      )}
    </>
  )
}

function JobCarousel({ jobs, onDetail, onClose }: { jobs: Job[]; onDetail: (job: Job) => void; onClose: () => void }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (jobs.length <= 1 || paused) return
    const id = setInterval(() => setIdx(p => (p + 1) % jobs.length), 6000)
    return () => clearInterval(id)
  }, [jobs.length, paused])

  const job = jobs[idx]
  if (!job) return null

  const rewardStr = job.reward.toLocaleString(undefined, { maximumFractionDigits: 0 })

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ background: `linear-gradient(90deg, ${colors.bgElevated}, ${colors.bgCard})`, padding: '12px 20px', borderRadius: radii.xl, marginBottom: 24, border: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <div style={{ background: colors.gold, color: '#000', fontSize: fontSizes.sm, fontWeight: 800, padding: '2px 8px', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>NEW</div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div key={idx} style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
          <span onClick={() => onDetail(job)} role="button" tabIndex={0} style={{ fontSize: fontSizes.lg, fontWeight: 600, color: colors.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', textAlign: 'center' }}>
            {job.title}
          </span>
        </div>
      </div>
      <span style={{ color: colors.gold, fontWeight: 600, fontSize: fontSizes.sm, whiteSpace: 'nowrap', flexShrink: 0 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</span>
      {jobs.length > 1 && (
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {jobs.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1} of ${jobs.length}`}
              style={{
                width: 12, height: 12, borderRadius: '50%', border: 'none', padding: 16, cursor: 'pointer',
                background: i === idx ? colors.gold : colors.border, transition: 'background 0.3s', flexShrink: 0,
                backgroundClip: 'content-box',
              }}
            />
          ))}
        </div>
      )}
      <button onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume carousel' : 'Pause carousel'} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: fontSizes.lg, padding: 0, flexShrink: 0, lineHeight: 1 }}>{paused ? '>' : '||'}</button>
      <button onClick={onClose} aria-label="Dismiss banner" style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: fontSizes.lg, padding: '0 0 0 4px', flexShrink: 0, lineHeight: 1 }}>X</button>
    </div>
  )
}

function SkeletonJobCard() {
  return (
    <div style={card} role="status" aria-busy={true} aria-label="Loading jobs">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 60, height: 22 }} />
        <div className="skeleton" style={{ width: 50, height: 22 }} />
      </div>
      <div className="skeleton" style={{ width: '70%', height: 18, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 4 }} />
      <div className="skeleton" style={{ width: '85%', height: 14, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: 120, height: 24, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ flex: 1, height: 36 }} />
        <div className="skeleton" style={{ flex: 1, height: 36 }} />
      </div>
    </div>
  )
}

function DeadlineValue({ createdAt, deadline }: { createdAt?: number; deadline: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setNow(Date.now()) }, COUNTDOWN_REFRESH)
    return () => clearInterval(id)
  }, [])
  const endMs = getDeadlineMs(createdAt, deadline)
  if (endMs === null) return <span style={{ opacity: 0.5 }}>{deadline}</span>
  const remaining = endMs - now
  if (remaining <= 0) return <span style={{ color: colors.red }}>{formatDeadlineDate(createdAt, deadline)} (expired)</span>
  if (remaining < 3600000) return <span style={{ color: colors.orange }}>{formatDeadlineDate(createdAt, deadline)} ({formatTimeRemaining(remaining)} left)</span>
  return <span style={{ color: colors.textDim }}>{formatDeadlineDate(createdAt, deadline)} ({formatTimeRemaining(remaining)} left)</span>
}

function JobCard({ job, onClaim, onDetail, claimingJobId }: { job: Job; onClaim: (job: Job) => void; onDetail: (job: Job) => void; claimingJobId?: number | null }) {
  const isMobile = useIsMobile()
  const rewardStr = job.reward.toLocaleString(undefined, { maximumFractionDigits: 0 })
  const claimedRatio = job.maxWorkers > 0 ? job.claimedCount / job.maxWorkers : 0
  const pad = isMobile ? 10 : 24

  return (
    <div className="job-card" style={{ ...card, padding: pad }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 4 : 12 }}>
        <div style={{ background: colors.borderLight, color: JOB_TYPE_CONFIGS[job.type]?.color || colors.gold, padding: isMobile ? '1px 6px' : '4px 12px', borderRadius: radii.full, fontSize: isMobile ? fontSizes.xs : fontSizes.sm, fontWeight: 600 }}>{JOB_TYPE_CONFIGS[job.type]?.label || job.type}</div>
        <div style={{ color: colors.gold, fontWeight: 700, fontSize: isMobile ? fontSizes.xs : fontSizes.sm }}>{job.difficulty}</div>
      </div>
      <div style={{ fontSize: isMobile ? fontSizes.md : fontSizes.xl, fontWeight: 700, marginBottom: isMobile ? 2 : 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
      {!isMobile && <div style={{ opacity: 0.7, fontSize: fontSizes.sm, marginBottom: 8 }}>{job.description}</div>}
      <div style={{ fontSize: isMobile ? fontSizes.xs : fontSizes.sm, marginBottom: isMobile ? 4 : 12 }}>
        <DeadlineValue createdAt={job.createdAt} deadline={job.deadline} />
      </div>
      <div style={{ margin: isMobile ? '4px 0' : '16px 0', fontSize: isMobile ? 14 : 20, color: colors.gold, fontWeight: 700 }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
      {!isMobile && <div style={{ fontSize: fontSizes.xs, opacity: 0.7, marginBottom: 8 }}>Posted by {shorten(job.poster)}</div>}
      <div style={{ marginBottom: isMobile ? 6 : 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? 9 : fontSizes.xs, opacity: 0.7, marginBottom: 2 }}>
          <span>{job.claimedCount}/{job.maxWorkers}</span>
          <span>{Math.round(claimedRatio * 100)}%</span>
        </div>
        <div style={{ background: colors.bgElevated, borderRadius: 4, height: isMobile ? 4 : 6, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(claimedRatio * 100, 100)}%`, background: claimedRatio >= 1 ? colors.green : colors.gold, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: isMobile ? 4 : 8 }}>
        <button
          onClick={() => onDetail(job)}
          aria-label={`View details for ${job.title}`}
          style={{ flex: 1, background: 'transparent', border: `1px solid ${colors.textDim}`, padding: isMobile ? '10px 4px' : '11px 9px', color: colors.textSecondary, cursor: 'pointer', borderRadius: radii.sm, fontWeight: 600, fontSize: isMobile ? fontSizes.xs : fontSizes.base, minHeight: 44 }}
        >
          DETAILS
        </button>
        <button
          onClick={() => onClaim(job)}
          disabled={claimingJobId === job.id}
          aria-label={`Claim job: ${job.title}`}
          style={{ flex: 1, background: colors.gold, color: '#000', border: 'none', padding: isMobile ? '10px 4px' : '11px 9px', fontWeight: 700, cursor: 'pointer', borderRadius: radii.sm, fontSize: isMobile ? fontSizes.xs : fontSizes.base, minHeight: 44 }}
        >
          {claimingJobId === job.id ? '...' : 'CLAIM'}
        </button>
      </div>
    </div>
  )
}

// Di mobile, list view jadi card sederhana agar mudah dibaca
function JobCardList({ job, onClaim, onDetail, claimingJobId, isMobile }: { job: Job; onClaim: (job: Job) => void; onDetail: (job: Job) => void; claimingJobId?: number | null; isMobile: boolean }) {
  const rewardStr = job.reward.toLocaleString(undefined, { maximumFractionDigits: 0 })
  const claimedRatio = job.maxWorkers > 0 ? job.claimedCount / job.maxWorkers : 0

  const sep = <div style={{ width: 1, height: 22, background: colors.border, flexShrink: 0 }} />

  // Di mobile, list view tampil sebagai mini card agar lebih readable
  if (isMobile) {
    return (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: fontSizes.md, flex: 1, marginRight: 8 }}>{job.title}</div>
          <div style={{ color: colors.gold, fontWeight: 700, fontSize: fontSizes.lg, whiteSpace: 'nowrap' }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: fontSizes.sm, color: JOB_TYPE_CONFIGS[job.type]?.color || colors.gold }}>{JOB_TYPE_CONFIGS[job.type]?.label || job.type}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onDetail(job)} style={{ background: 'transparent', border: `1px solid ${colors.textDim}`, color: colors.textSecondary, padding: '5px 10px', borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.sm, fontWeight: 600, minHeight: isMobile ? 44 : 34 }}>DETAILS</button>
            <button onClick={() => onClaim(job)} disabled={claimingJobId === job.id} style={{ background: colors.gold, color: '#000', border: 'none', padding: '5px 12px', borderRadius: radii.sm, fontWeight: 700, cursor: 'pointer', fontSize: fontSizes.sm, minHeight: isMobile ? 44 : 34 }}>
              {claimingJobId === job.id ? '...' : 'CLAIM'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'transparent', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: fontSizes.base }}>
      <div style={{ fontWeight: 700, flex: '1 1 160px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
      {sep}
      <div style={{ flex: '0 0 90px', color: JOB_TYPE_CONFIGS[job.type]?.color || colors.gold, fontSize: fontSizes.sm, fontWeight: 600 }}>{JOB_TYPE_CONFIGS[job.type]?.label || job.type}</div>
      {sep}
      <div style={{ flex: '0 0 120px', color: colors.gold, fontWeight: 600, whiteSpace: 'nowrap' }}>{rewardStr} {job.tokenSymbol || 'zkLTC'}</div>
      {sep}
      <div style={{ flex: '1 1 110px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSizes.sm, opacity: 0.5 }}>
        <DeadlineValue createdAt={job.createdAt} deadline={job.deadline} />
      </div>
      {sep}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '0 0 70px', fontSize: fontSizes.xs, color: colors.textDim }}>
        <div style={{ width: 24, height: 4, background: colors.bgElevated, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(claimedRatio * 100, 100)}%`, background: claimedRatio >= 1 ? colors.green : colors.gold, height: '100%', borderRadius: 2 }} />
        </div>
        <span>{job.claimedCount}/{job.maxWorkers}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
        <button onClick={() => onDetail(job)} aria-label={`View details for ${job.title}`} style={{ background: 'transparent', border: `1px solid ${colors.textDim}`, color: colors.textSecondary, padding: '3px 8px', borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.xs, fontWeight: 600 }}>DETAILS</button>
        <button onClick={() => onClaim(job)} disabled={claimingJobId === job.id} aria-label={`Claim job: ${job.title}`} style={{ background: colors.gold, color: '#000', border: 'none', padding: '3px 10px', borderRadius: radii.sm, fontWeight: 700, cursor: 'pointer', fontSize: fontSizes.xs }}>
          {claimingJobId === job.id ? '...' : 'CLAIM'}
        </button>
      </div>
    </div>
  )
}