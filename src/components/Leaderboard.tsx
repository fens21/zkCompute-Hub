import { useState, useEffect } from 'react'
import type { LeaderboardEntry, Job } from '../types'
import { shorten, formatUsd, fmt } from '../utils'
import { colors, radii, fontSizes } from '../styles/tokens'
import { useIsMobile } from '../hooks/useIsMobile'

const TABLE_COLS = '36px 1fr 70px 100px 70px'

function TableHeader() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, padding: '8px 4px', borderBottom: `1px solid ${colors.borderLight}`, fontSize: fontSizes.xs, opacity: 0.45, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      <span>#</span><span>Worker</span><span>Jobs</span><span>Earned</span><span title="Points calculated from jobs completed and performance" style={{ cursor: 'help' }}>Pts ⓘ</span>
    </div>
  )
}

export function Leaderboard({ leaderboard, leaderboardLoading, onViewWorker, ltcPrice, onChainJobs: _onChainJobs, onRetry }: {
  leaderboard: LeaderboardEntry[]
  leaderboardLoading: boolean
  onViewWorker: (worker: string, entry: LeaderboardEntry, rank: number) => void
  ltcPrice: number | null
  onChainJobs?: Job[]
  onRetry?: () => void
}) {
  const isMobile = useIsMobile()
  const PER_PAGE = 20
  const [page, setPage] = useState(1)
  const sliced = leaderboard.slice(3)
  const totalPages = Math.max(1, Math.ceil(sliced.length / PER_PAGE))

  useEffect(() => { setPage(1) }, [leaderboard.length])

  const hasData = leaderboard.length > 0
  const inferredError = false

  if (inferredError) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <h1 style={{ fontSize: isMobile ? 20 : fontSizes.heading, margin: 0, color: colors.gold, lineHeight: 1.3 }}>Top Worker</h1>
        </div>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.red}`, borderRadius: radii.xl, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>!</div>
          <div style={{ opacity: 0.7, marginBottom: 16, fontSize: fontSizes.md }}>Failed to load Top Worker data.</div>
          {onRetry && <button onClick={onRetry} style={{ background: colors.gold, color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: radii.md, cursor: 'pointer' }}>RETRY</button>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' }}>
        <h1 style={{ fontSize: isMobile ? 20 : fontSizes.heading, margin: 0, color: colors.gold, lineHeight: 1.3 }}>Top Worker</h1>
        {onRetry && <div style={{ position: 'absolute', right: 0 }}><button onClick={onRetry} aria-label="Refresh leaderboard" style={{ background: colors.bgElevated, color: colors.textMuted, border: 'none', width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh data">↻</button></div>}
      </div>
      <p style={{ textAlign: 'center', opacity: 0.6, fontSize: fontSizes.base, marginBottom: 24 }}>Rankings based on jobs completed and points earned on-chain</p>

      {hasData && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PodiumCard rank={1} entry={leaderboard[0]} onView={onViewWorker} ltcPrice={ltcPrice} isMobile={isMobile} />
          </div>
          {(leaderboard[1] || leaderboard[2]) && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 2, height: 20, background: colors.border }} />
            </div>
          )}
          {(leaderboard[1] || leaderboard[2]) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 12 : 24 }}>
              <PodiumCard rank={2} entry={leaderboard[1]} onView={onViewWorker} ltcPrice={ltcPrice} isMobile={isMobile} />
              <PodiumCard rank={3} entry={leaderboard[2]} onView={onViewWorker} ltcPrice={ltcPrice} isMobile={isMobile} />
            </div>
          )}
        </div>
      )}

      {hasData && sliced.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: fontSizes.base, opacity: 0.35, textTransform: 'uppercase', letterSpacing: 1 }}>All Workers</span>
        </div>
      )}

      {hasData && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" style={{ background: page <= 1 ? colors.bgCard : colors.bgElevated, border: `1px solid ${colors.borderLight}`, color: page <= 1 ? colors.border : colors.textSecondary, padding: '6px 14px', borderRadius: radii.sm, cursor: page <= 1 ? 'default' : 'pointer', fontSize: fontSizes.base, fontWeight: 600, minHeight: isMobile ? 44 : 32 }}>← Prev</button>
          <span style={{ fontSize: fontSizes.base, opacity: 0.6 }}>Page {page} of {totalPages} ({sliced.length} total)</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page" style={{ background: page >= totalPages ? colors.bgCard : colors.bgElevated, border: `1px solid ${colors.borderLight}`, color: page >= totalPages ? colors.border : colors.textSecondary, padding: '6px 14px', borderRadius: radii.sm, cursor: page >= totalPages ? 'default' : 'pointer', fontSize: fontSizes.base, fontWeight: 600, minHeight: isMobile ? 44 : 32 }}>Next →</button>
        </div>
      )}

      {leaderboardLoading ? (
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.xl, padding: '8px 12px' }}>
          <TableHeader />
          {['Rank', 'Worker', 'Jobs', 'Earned', 'Points'].map((label, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, padding: '10px 4px', borderBottom: i < 4 ? `1px solid ${colors.bgElevated}` : 'none', alignItems: 'center' }}>
              <div style={{ height: 12, width: 24, background: colors.bgElevated, borderRadius: radii.sm }} aria-label={`Loading ${label}`} />
              <div style={{ height: 12, width: '60%', background: colors.bgElevated, borderRadius: radii.sm }} aria-label={`Loading ${label}`} />
              <div style={{ height: 12, width: 40, background: colors.bgElevated, borderRadius: radii.sm }} aria-label={`Loading ${label}`} />
              <div style={{ height: 20, width: 70, background: colors.bgElevated, borderRadius: radii.sm }} aria-label={`Loading ${label}`} />
              <div style={{ height: 12, width: 30, background: colors.bgElevated, borderRadius: radii.sm }} aria-label={`Loading ${label}`} />
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.xl, padding: 40, textAlign: 'center' }}>
          <div style={{ marginBottom: 16, opacity: 0.7 }}>No workers yet &mdash; be the first to claim a job!</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.xl, padding: '8px 12px', minWidth: isMobile ? 300 : 500 }}>
            <TableHeader />
            {sliced.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((w, i) => {
              const rank = i + 4 + (page - 1) * PER_PAGE
              const last = i === Math.min(PER_PAGE, sliced.length - (page - 1) * PER_PAGE) - 1
              return (
                <div key={w.worker} onClick={() => onViewWorker(w.worker, w, rank)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onViewWorker(w.worker, w, rank) }} style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, padding: '10px 4px', borderBottom: last ? 'none' : `1px solid ${colors.bgElevated}`, alignItems: 'center', fontSize: fontSizes.base, cursor: 'pointer', borderRadius: radii.sm, transition: 'background 0.15s' }}>
                  <span style={{ color: colors.textMuted, fontWeight: 700 }}>#{rank}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.gold, fontSize: fontSizes.sm, textAlign: 'left', textDecoration: 'underline', textUnderlineOffset: 2 }}>{shorten(w.worker)}</span>
                  <span style={{ fontSize: fontSizes.sm, opacity: 0.7 }}>{w.jobsPaid}<span style={{ opacity: 0.3 }}>/</span>{w.jobsClaimed}</span>
                  <span style={{ lineHeight: 1.5 }}>
                    <span style={{ color: colors.green, fontWeight: 600, fontSize: fontSizes.sm }}>{formatUsd(ltcPrice !== null ? w.earnedZkltc * ltcPrice + w.earnedUsdc : null)}</span>
                    {w.earnedZkltc > 0 && <span style={{ display: 'block', fontSize: 9, opacity: 0.55, color: colors.gold }}>{fmt(w.earnedZkltc)} zkLTC</span>}
                    {w.earnedUsdc > 0 && <span style={{ display: 'block', fontSize: 9, opacity: 0.55, color: colors.blue }}>{fmt(w.earnedUsdc)} USDC</span>}
                  </span>
                  <span style={{ color: colors.green, fontWeight: 600, fontSize: fontSizes.base }}>{w.points}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PodiumCard({ rank, entry, onView, ltcPrice, isMobile }: {
  rank: number
  entry?: LeaderboardEntry
  onView: (worker: string, entry: LeaderboardEntry, rank: number) => void
  ltcPrice: number | null
  isMobile?: boolean
}) {
  const medal = rank === 1 ? '\u{1F947}' : rank === 2 ? '\u{1F948}' : '\u{1F949}'
  const border = rank === 1 ? colors.gold : rank === 2 ? '#c0c0c0' : '#cd7f32'
  const bg = rank === 1 ? '#1a1a0a' : rank === 2 ? colors.bgElevated : '#1a0a0a'
  const glow = rank === 1 ? '0 0 14px rgba(247, 206, 62, 0.12)' : rank === 2 ? '0 0 8px rgba(192, 192, 192, 0.08)' : '0 0 8px rgba(205, 127, 50, 0.08)'
  return (
    <div style={{ background: bg, border: `2px solid ${border}`, borderRadius: radii.lg, padding: isMobile ? '8px 12px' : '10px 20px', textAlign: 'center', minWidth: isMobile ? 140 : 220, opacity: entry ? 1 : 0.3, boxShadow: glow }}>
      {entry && <div style={{ fontSize: fontSizes.heading, marginBottom: 2 }}>{medal}</div>}
      {entry ? (
        <>
          <button
            onClick={() => onView(entry.worker, entry, rank)}
            aria-label={`View #${rank} worker details`}
            style={{ background: 'transparent', border: 'none', color: colors.gold, cursor: 'pointer', fontSize: fontSizes.base, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {shorten(entry.worker)}
          </button>
          <div style={{ color: colors.green, fontWeight: 700, fontSize: fontSizes.lg, marginTop: 4 }}>{formatUsd(ltcPrice !== null ? entry.earnedZkltc * ltcPrice + entry.earnedUsdc : null)}</div>
          <div style={{ fontSize: fontSizes.xs, opacity: 0.6, marginTop: 3 }}>{entry.jobsPaid}/{entry.jobsClaimed} jobs · {entry.points} pts</div>
        </>
      ) : (
        <div style={{ fontSize: fontSizes.sm, opacity: 0.4, marginTop: 4 }}>—</div>
      )}
    </div>
  )
}
