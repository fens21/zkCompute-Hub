import type { LeaderboardEntry } from '../types'

function formatUsd(entry: LeaderboardEntry, ltcPrice: number | null): string {
  if (ltcPrice === null) return '...'
  const usd = entry.earnedZkltc * ltcPrice + entry.earnedUsdc
  if (usd < 1) return '$' + usd.toFixed(2)
  if (usd < 1000) return '$' + usd.toFixed(0)
  return '$' + (usd / 1000).toFixed(1) + 'k'
}

export function Leaderboard({ leaderboard, leaderboardLoading, onViewWorker, ltcPrice }: {
  leaderboard: LeaderboardEntry[]
  leaderboardLoading: boolean
  onViewWorker: (worker: string, entry: LeaderboardEntry, rank: number) => void
  ltcPrice: number | null
}) {
  const hasData = leaderboard.length > 0

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 8, color: '#fff' }}>Top Worker Leaderboard</h2>
      <p style={{ opacity: 0.6, fontSize: 12, marginBottom: 24 }}>Rankings based on jobs completed and points earned on-chain</p>

      {hasData && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PodiumCard rank={1} entry={leaderboard[0]} onView={onViewWorker} ltcPrice={ltcPrice} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 2, height: 20, background: '#2a2a2a' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 700, margin: '0 auto' }}>
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

      {leaderboardLoading ? (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, textAlign: 'center', opacity: 0.6 }}>
          Loading on-chain data...
        </div>
      ) : leaderboard.length === 0 ? (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, textAlign: 'center', opacity: 0.6 }}>
          No workers yet — be the first to claim a job!
        </div>
      ) : (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '8px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 60px 100px 60px 60px', padding: '8px 4px', borderBottom: '1px solid #333', fontSize: 10, opacity: 0.45, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>#</span><span>Worker</span><span>Jobs</span><span>Earned</span><span>Pts</span><span></span>
          </div>
          {leaderboard.slice(3).map((w, i) => {
            const rank = i + 4
            return (
              <div key={w.worker} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 60px 100px 60px 60px', padding: '10px 4px', borderBottom: i < leaderboard.slice(3).length - 1 ? '1px solid #1a1a1a' : 'none', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: '#888', fontWeight: 700 }}>#{rank}</span>
                <button
                  onClick={() => onViewWorker(w.worker, w, rank)}
                  style={{ background: 'transparent', border: 'none', color: '#ffd700', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 11, textAlign: 'left', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.worker.slice(0, 4)}...{w.worker.slice(-4)}
                </button>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{w.jobsPaid}<span style={{ opacity: 0.3 }}>/</span>{w.jobsClaimed}</span>
                <span style={{ lineHeight: 1.5 }}>
                  <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 11 }}>{formatUsd(w, ltcPrice)}</span>
                  {w.earnedZkltc > 0 && <span style={{ display: 'block', fontSize: 9, opacity: 0.55, color: '#ffd700' }}>{w.earnedZkltc} zkLTC</span>}
                  {w.earnedUsdc > 0 && <span style={{ display: 'block', fontSize: 9, opacity: 0.55, color: '#2775ca' }}>{w.earnedUsdc} USDC</span>}
                </span>
                <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 12 }}>{w.points}</span>
                <button
                  onClick={() => onViewWorker(w.worker, w, rank)}
                  style={{ background: '#1a1a1a', border: '1px solid #444', color: '#aaa', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                  VIEW
                </button>
              </div>
            )
          })}
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
            style={{ background: 'transparent', border: 'none', color: '#ffd700', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {entry.worker.slice(0, 6)}...{entry.worker.slice(-4)}
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
