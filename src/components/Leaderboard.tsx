import { useState, useEffect } from 'react'
import type { LeaderboardEntry, Job } from '../types'
import { shorten } from '../utils'

function formatUsd(entry: LeaderboardEntry, ltcPrice: number | null): string {
  if (ltcPrice === null) return '...'
  const usd = entry.earnedZkltc * ltcPrice + entry.earnedUsdc
  if (usd < 1) return '$' + usd.toFixed(2)
  if (usd < 1000) return '$' + usd.toFixed(0)
  return '$' + (usd / 1000).toFixed(1) + 'k'
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const TABLE_COLS = '36px 1fr 60px 100px 60px 60px'

function TableHeader() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, padding: '8px 4px', borderBottom: '1px solid #333', fontSize: 10, opacity: 0.45, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      <span>#</span><span>Worker</span><span>Jobs</span><span>Earned</span><span>Pts</span><span></span>
    </div>
  )
}

export function Leaderboard({ leaderboard, leaderboardLoading, onViewWorker, ltcPrice, onChainJobs, onRetry }: {
  leaderboard: LeaderboardEntry[]
  leaderboardLoading: boolean
  onViewWorker: (worker: string, entry: LeaderboardEntry, rank: number) => void
  ltcPrice: number | null
  onChainJobs?: Job[]
  onRetry?: () => void
}) {
  const PER_PAGE = 20
  const [page, setPage] = useState(1)
  const sliced = leaderboard.slice(3)
  const totalPages = Math.max(1, Math.ceil(sliced.length / PER_PAGE))

  useEffect(() => { setPage(1) }, [leaderboard.length])

  const hasData = leaderboard.length > 0
  const inferredError = !leaderboardLoading && !hasData && (onChainJobs?.length ?? 0) > 0

  if (inferredError) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <h2 style={{ fontSize: 20, margin: 0, color: '#fff' }}>Top Worker Leaderboard</h2>
        </div>
        <div style={{ background: '#111', border: '1px solid #ff6b6b', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
          <div style={{ opacity: 0.7, marginBottom: 16, fontSize: 13 }}>Failed to load leaderboard data.</div>
          {onRetry && <button onClick={onRetry} style={{ background: '#ffd700', color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>RETRY</button>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' }}>
        <h2 style={{ fontSize: 20, margin: 0, color: '#fff' }}>Top Worker Leaderboard</h2>
        {onRetry && <div style={{ position: 'absolute', right: 0 }}><button onClick={onRetry} aria-label="Refresh leaderboard" style={{ background: '#222', color: '#888', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh">↻</button></div>}
      </div>
      <p style={{ textAlign: 'center', opacity: 0.6, fontSize: 12, marginBottom: 24 }}>Rankings based on jobs completed and points earned on-chain</p>

      {hasData && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PodiumCard rank={1} entry={leaderboard[0]} onView={onViewWorker} ltcPrice={ltcPrice} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 2, height: 20, background: '#2a2a2a' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <PodiumCard rank={2} entry={leaderboard[1]} onView={onViewWorker} ltcPrice={ltcPrice} />
            <PodiumCard rank={3} entry={leaderboard[2]} onView={onViewWorker} ltcPrice={ltcPrice} />
          </div>
        </div>
      )}

      {hasData && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 12, opacity: 0.35, textTransform: 'uppercase', letterSpacing: 1 }}>All Workers</span>
        </div>
      )}

      {hasData && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: page <= 1 ? '#111' : '#1a1a1a', border: '1px solid #333', color: page <= 1 ? '#555' : '#ccc', padding: '4px 12px', borderRadius: 6, cursor: page <= 1 ? 'default' : 'pointer', fontSize: 11, fontWeight: 600 }}>◀ Prev</button>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ background: page >= totalPages ? '#111' : '#1a1a1a', border: '1px solid #333', color: page >= totalPages ? '#555' : '#ccc', padding: '4px 12px', borderRadius: 6, cursor: page >= totalPages ? 'default' : 'pointer', fontSize: 11, fontWeight: 600 }}>Next ▶</button>
        </div>
      )}

      {leaderboardLoading ? (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '8px 12px' }}>
          <TableHeader />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, padding: '10px 4px', borderBottom: i < 4 ? '1px solid #1a1a1a' : 'none', alignItems: 'center' }}>
              <span className="skeleton" style={{ width: 24, height: 14, display: 'inline-block' }} />
              <span className="skeleton" style={{ width: '60%', height: 14, display: 'inline-block' }} />
              <span className="skeleton" style={{ width: 40, height: 14, display: 'inline-block' }} />
              <span className="skeleton" style={{ width: 70, height: 24, display: 'inline-block' }} />
              <span className="skeleton" style={{ width: 30, height: 14, display: 'inline-block' }} />
              <span className="skeleton" style={{ width: 40, height: 22, display: 'inline-block' }} />
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
          <div style={{ marginBottom: 16, opacity: 0.7 }}>No workers yet &mdash; be the first to claim a job!</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '8px 12px', minWidth: 500 }}>
            <TableHeader />
            {sliced.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((w, i) => {
              const rank = i + 4 + (page - 1) * PER_PAGE
              const last = i === Math.min(PER_PAGE, sliced.length - (page - 1) * PER_PAGE) - 1
              return (
                <div key={w.worker} style={{ display: 'grid', gridTemplateColumns: TABLE_COLS, padding: '10px 4px', borderBottom: last ? 'none' : '1px solid #1a1a1a', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: '#888', fontWeight: 700 }}>#{rank}</span>
                  <button
                    onClick={() => onViewWorker(w.worker, w, rank)}
                    aria-label={`View worker #${rank}`}
                    style={{ background: 'transparent', border: 'none', color: '#ffd700', cursor: 'pointer', fontSize: 11, textAlign: 'left', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shorten(w.worker)}
                  </button>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{w.jobsPaid}<span style={{ opacity: 0.3 }}>/</span>{w.jobsClaimed}</span>
                  <span style={{ lineHeight: 1.5 }}>
                    <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 11 }}>{formatUsd(w, ltcPrice)}</span>
                    {w.earnedZkltc > 0 && <span style={{ display: 'block', fontSize: 9, opacity: 0.55, color: '#ffd700' }}>{fmt(w.earnedZkltc)} zkLTC</span>}
                    {w.earnedUsdc > 0 && <span style={{ display: 'block', fontSize: 9, opacity: 0.55, color: '#2775ca' }}>{fmt(w.earnedUsdc)} USDC</span>}
                  </span>
                  <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 12 }}>{w.points}</span>
                  <button
                    onClick={() => onViewWorker(w.worker, w, rank)}
                    aria-label={`View worker #${rank} details`}
                    style={{ background: '#1a1a1a', border: '1px solid #444', color: '#aaa', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                    VIEW
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PodiumCard({ rank, entry, onView, ltcPrice }: {
  rank: number
  entry?: LeaderboardEntry
  onView: (worker: string, entry: LeaderboardEntry, rank: number) => void
  ltcPrice: number | null
}) {
  const medal = rank === 1 ? '\u{1F947}' : rank === 2 ? '\u{1F948}' : '\u{1F949}'
  const border = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32'
  const bg = rank === 1 ? '#1a1a0a' : rank === 2 ? '#1a1a1a' : '#1a0a0a'
  const glow = rank === 1 ? '0 0 14px rgba(255, 215, 0, 0.12)' : rank === 2 ? '0 0 8px rgba(192, 192, 192, 0.08)' : '0 0 8px rgba(205, 127, 50, 0.08)'
  return (
    <div style={{ background: bg, border: `2px solid ${border}`, borderRadius: 10, padding: '10px 20px', textAlign: 'center', minWidth: 220, opacity: entry ? 1 : 0.25, boxShadow: glow }}>
      <div style={{ fontSize: 22, marginBottom: 2 }}>{medal}</div>
      {entry ? (
        <>
          <button
            onClick={() => onView(entry.worker, entry, rank)}
            aria-label={`View #${rank} worker details`}
            style={{ background: 'transparent', border: 'none', color: '#ffd700', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {shorten(entry.worker)}
          </button>
          <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 14, marginTop: 4 }}>{formatUsd(entry, ltcPrice)}</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>{entry.jobsPaid}/{entry.jobsClaimed} jobs &bull; {entry.points} pts</div>
        </>
      ) : (
        <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>—</div>
      )}
    </div>
  )
}
