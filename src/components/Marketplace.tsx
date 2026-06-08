import { useState, useEffect } from 'react'
import type { Job, SortBy } from '../types'
import { shorten, getDeadlineMs, formatTimeRemaining, formatDeadlineDate, COUNTDOWN_REFRESH } from '../utils'
import { colors, radii, fontSizes, card, input } from '../styles/tokens'
import { useIsMobile } from '../hooks/useIsMobile'
import { JOB_TYPE_CONFIGS } from '../constants/jobTypes'
import { SearchableSelect } from './SearchableSelect'

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
  }, [typeFilter, sortBy, jobs.length])

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
          <button onClick={() => setViewMode('grid')} aria-label="Grid view" style={{ background: viewMode === 'grid' ? colors.gold : 'rgba(197,193,192,0.04)', color: viewMode === 'grid' ? '#000' : colors.textDim, border: `1px solid ${viewMode === 'grid' ? colors.gold : 'rgba(197,193,192,0.08)'}`, width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.lg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (viewMode !== 'grid') { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.color = colors.textPrimary; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.2)' } }}
            onMouseLeave={e => { if (viewMode !== 'grid') { e.currentTarget.style.background = 'rgba(197,193,192,0.04)'; e.currentTarget.style.color = colors.textDim; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.08)' } }}
            onFocus={e => { if (viewMode !== 'grid') { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.color = colors.textPrimary; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.2)' } }}
            onBlur={e => { if (viewMode !== 'grid') { e.currentTarget.style.background = 'rgba(197,193,192,0.04)'; e.currentTarget.style.color = colors.textDim; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.08)' } }} title="Grid view">▦</button>
          <button onClick={() => setViewMode('list')} aria-label="List view" style={{ background: viewMode === 'list' ? colors.gold : 'rgba(197,193,192,0.04)', color: viewMode === 'list' ? '#000' : colors.textDim, border: `1px solid ${viewMode === 'list' ? colors.gold : 'rgba(197,193,192,0.08)'}`, width: 32, height: 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (viewMode !== 'list') { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.color = colors.textPrimary; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.2)' } }}
            onMouseLeave={e => { if (viewMode !== 'list') { e.currentTarget.style.background = 'rgba(197,193,192,0.04)'; e.currentTarget.style.color = colors.textDim; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.08)' } }}
            onFocus={e => { if (viewMode !== 'list') { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.color = colors.textPrimary; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.2)' } }}
            onBlur={e => { if (viewMode !== 'list') { e.currentTarget.style.background = 'rgba(197,193,192,0.04)'; e.currentTarget.style.color = colors.textDim; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.08)' } }} title="List view">☰</button>
        </div>
        <div style={{ flex: isMobile ? '1' : 'none', minWidth: isMobile ? 100 : 160, maxWidth: isMobile ? '' : 200 }}>
          <SearchableSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: '', label: 'All Types' },
              ...Object.entries(JOB_TYPE_CONFIGS).map(([key, cfg]) => ({ value: key, label: cfg.label })),
            ]}
            placeholder="Filter by type..."
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          aria-label="Sort jobs"
          style={{ ...input, flex: isMobile ? '1' : 'none', minWidth: isMobile ? 80 : 0, boxSizing: 'border-box' as const }}
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
            {typeFilter ? '🔍 No Match' : 'No Jobs'}
          </div>
          {typeFilter
            ? 'No jobs match this type — try a different filter.'
            : 'No jobs available — be the first to post one!'}
        </div>
      ) : (
        <>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: page <= 1 ? colors.bgCard : colors.bgElevated, border: `1px solid ${page <= 1 ? 'rgba(197,193,192,0.06)' : 'rgba(197,193,192,0.12)'}`, color: page <= 1 ? colors.textDim : colors.textPrimary, padding: '4px 12px', borderRadius: radii.sm, cursor: page <= 1 ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (page > 1) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onMouseLeave={e => { if (page > 1) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}
                onFocus={e => { if (page > 1) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onBlur={e => { if (page > 1) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}>Prev</button>
              <span style={{ fontSize: fontSizes.base, color: colors.textDim }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!hasMore} style={{ background: !hasMore ? colors.bgCard : colors.bgElevated, border: `1px solid ${!hasMore ? 'rgba(197,193,192,0.06)' : 'rgba(197,193,192,0.12)'}`, color: !hasMore ? colors.textDim : colors.textPrimary, padding: '4px 12px', borderRadius: radii.sm, cursor: !hasMore ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (hasMore) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onMouseLeave={e => { if (hasMore) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}
                onFocus={e => { if (hasMore) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onBlur={e => { if (hasMore) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}>Next</button>
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
            <div key={`${typeFilter}-${sortBy}`} className="job-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 10 : 16 }}>
              {pagedJobs.map(job => (
                <JobCard key={job.id} job={job} onClaim={onClaim} onDetail={onDetail} claimingJobId={claimingJobId} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: page <= 1 ? colors.bgCard : colors.bgElevated, border: `1px solid ${page <= 1 ? 'rgba(197,193,192,0.06)' : 'rgba(197,193,192,0.12)'}`, color: page <= 1 ? colors.textDim : colors.textPrimary, padding: '4px 12px', borderRadius: radii.sm, cursor: page <= 1 ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (page > 1) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onMouseLeave={e => { if (page > 1) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}
                onFocus={e => { if (page > 1) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onBlur={e => { if (page > 1) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}>Prev</button>
              <span style={{ fontSize: fontSizes.base, color: colors.textDim }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={!hasMore} style={{ background: !hasMore ? colors.bgCard : colors.bgElevated, border: `1px solid ${!hasMore ? 'rgba(197,193,192,0.06)' : 'rgba(197,193,192,0.12)'}`, color: !hasMore ? colors.textDim : colors.textPrimary, padding: '4px 12px', borderRadius: radii.sm, cursor: !hasMore ? 'default' : 'pointer', fontSize: fontSizes.sm, fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (hasMore) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onMouseLeave={e => { if (hasMore) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}
                onFocus={e => { if (hasMore) { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.3)' } }}
                onBlur={e => { if (hasMore) { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.12)' } }}>Next</button>
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
                width: 10, height: 10, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                background: i === idx ? colors.gold : 'rgba(197,193,192,0.2)', transition: 'background 0.3s', flexShrink: 0,
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
  const isFull = job.claimedCount >= job.maxWorkers
  const isAlmostFull = claimedRatio >= 0.67 && !isFull
  const pad = isMobile ? 10 : 20

  // deadline urgency check
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setNow(Date.now()) }, COUNTDOWN_REFRESH)
    return () => clearInterval(id)
  }, [])
  const endMs = getDeadlineMs(job.createdAt, job.deadline)
  const isUrgent = endMs !== null && endMs - now < 24 * 3600 * 1000 && endMs > now

  const progressColor = isFull ? colors.green : isAlmostFull ? colors.orange : colors.gold

  return (
    <div className="job-card" style={{
      ...card,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(26,41,48,0.97)',
      borderTop: `3px solid ${isFull ? colors.green : isUrgent ? colors.red : JOB_TYPE_CONFIGS[job.type]?.color || colors.gold}`,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Almost full / Full badge */}
      {(isFull || isAlmostFull) && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: isFull ? '#0d2e1a' : '#2a1500',
          border: `1px solid ${isFull ? colors.green : colors.orange}`,
          color: isFull ? colors.green : colors.orange,
          fontSize: 9, fontWeight: 700, padding: '2px 7px',
          borderRadius: radii.full, letterSpacing: 0.5,
        }}>
          {isFull ? 'FULL' : 'ALMOST FULL'}
        </div>
      )}

      {/* Category + Job Type badges */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: isMobile ? 6 : 10, flexWrap: 'wrap' }}>
        <div style={{
          background: `${JOB_TYPE_CONFIGS[job.type]?.color || colors.gold}18`,
          color: JOB_TYPE_CONFIGS[job.type]?.color || colors.gold,
          padding: isMobile ? '1px 6px' : '3px 10px',
          borderRadius: radii.full,
          fontSize: isMobile ? fontSizes.xs : fontSizes.sm,
          fontWeight: 600,
        }}>
          {JOB_TYPE_CONFIGS[job.type]?.label || job.type}
        </div>
        {/* Job type ZK/Standard pill */}
        <div style={{
          background: job.type === 'ZK' ? 'rgba(167,139,250,0.12)' : 'rgba(74,222,128,0.08)',
          color: job.type === 'ZK' ? '#a78bfa' : colors.green,
          padding: isMobile ? '1px 6px' : '3px 10px',
          borderRadius: radii.full,
          fontSize: isMobile ? fontSizes.xs : fontSizes.sm,
          fontWeight: 600,
          border: `1px solid ${job.type === 'ZK' ? 'rgba(167,139,250,0.25)' : 'rgba(74,222,128,0.15)'}`,
        }}>
          {job.type === 'ZK' ? '⚡ ZK' : '✓ Standard'}
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontSize: isMobile ? fontSizes.md : fontSizes.xl,
        fontWeight: 700,
        marginBottom: isMobile ? 2 : 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {job.title}
      </div>

      {/* Description */}
      <div style={{
        opacity: 0.6,
        fontSize: isMobile ? fontSizes.xs : fontSizes.sm,
        marginBottom: isMobile ? 6 : 8,
        overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        lineHeight: 1.4,
      }}>
        {job.description}
      </div>

      {/* Deadline */}
      <div style={{
        fontSize: isMobile ? fontSizes.xs : fontSizes.sm,
        marginBottom: isMobile ? 4 : 8,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {isUrgent && <span style={{ color: colors.red, fontSize: 10, fontWeight: 700 }}>🔥 URGENT</span>}
        <DeadlineValue createdAt={job.createdAt} deadline={job.deadline} />
      </div>

      {/* Reward */}
      <div style={{
        margin: isMobile ? '4px 0' : '6px 0',
        fontSize: isMobile ? 16 : 22,
        color: colors.gold, fontWeight: 700,
        display: 'flex', alignItems: 'baseline', gap: 4,
      }}>
        {rewardStr}
        <span style={{ fontSize: isMobile ? fontSizes.xs : fontSizes.sm, opacity: 0.8 }}>{job.tokenSymbol || 'zkLTC'}</span>
      </div>

      {/* Posted by */}
      <div style={{ fontSize: fontSizes.xs, opacity: 0.5, marginBottom: isMobile ? 6 : 10 }}>
        Posted by {shorten(job.poster)}
      </div>

      {/* Workers progress */}
      <div style={{ marginBottom: isMobile ? 8 : 12 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: fontSizes.xs, marginBottom: 4,
          color: progressColor, opacity: 0.85,
        }}>
          <span style={{ fontWeight: 600 }}>
            {job.claimedCount}/{job.maxWorkers} workers{isFull ? ' (full)' : isAlmostFull ? ' — almost full' : ''}
          </span>
          <span>{Math.round(claimedRatio * 100)}%</span>
        </div>
        <div style={{ background: colors.bgElevated, borderRadius: 4, height: isMobile ? 4 : 5, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(claimedRatio * 100, 100)}%`,
            background: progressColor,
            height: '100%', borderRadius: 4, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: isMobile ? 4 : 8, marginTop: 'auto' }}>
        <button
          onClick={() => onDetail(job)}
          aria-label={`View details for ${job.title}`}
          style={{
            flex: 1,
            background: 'rgba(197,193,192,0.06)',
            border: `1px solid rgba(197,193,192,0.2)`,
            padding: isMobile ? '10px 4px' : '11px 9px',
            color: colors.textPrimary,
            cursor: 'pointer', borderRadius: radii.sm,
            fontWeight: 600,
            fontSize: isMobile ? fontSizes.xs : fontSizes.sm,
            minHeight: 44,
          }}
        >
          DETAILS
        </button>
        <button
          onClick={() => onClaim(job)}
          disabled={claimingJobId === job.id || isFull}
          aria-label={`Claim job: ${job.title}`}
          style={{
            flex: 1,
            background: isFull ? '#333' : colors.gold,
            color: isFull ? '#666' : '#000',
            border: 'none',
            padding: isMobile ? '10px 4px' : '11px 9px',
            fontWeight: 700, cursor: isFull ? 'not-allowed' : 'pointer',
            borderRadius: radii.sm,
            fontSize: isMobile ? fontSizes.xs : fontSizes.sm,
            minHeight: 44,
            opacity: isFull ? 0.5 : 1,
          }}
        >
          {claimingJobId === job.id ? '...' : isFull ? 'FULL' : 'CLAIM'}
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