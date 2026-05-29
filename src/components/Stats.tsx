import type { Job, LeaderboardEntry } from '../types'

function jobUsd(reward: number, tokenSymbol: string | undefined, ltcPrice: number | null): string {
  if (ltcPrice === null) return ''
  const rate = tokenSymbol === 'USDC' ? 1 : ltcPrice
  const usd = reward * rate
  if (usd < 1) return '$' + usd.toFixed(2)
  if (usd < 1000) return '$' + usd.toFixed(0)
  return '$' + (usd / 1000).toFixed(1) + 'k'
}

export function Stats({ onChainJobs, leaderboard, ltcPrice, address }: {
  onChainJobs: Job[]
  leaderboard: LeaderboardEntry[]
  ltcPrice: number | null
  address: string
}) {
  const totalEscrowedZkltc = onChainJobs.filter(j => j.tokenSymbol !== 'USDC').reduce((s, j) => s + j.reward * j.maxWorkers, 0)
  const totalEscrowedUsdc = onChainJobs.filter(j => j.tokenSymbol === 'USDC').reduce((s, j) => s + j.reward * j.maxWorkers, 0)
  const totalEscrowedUsd = ltcPrice ? (totalEscrowedZkltc * ltcPrice + totalEscrowedUsdc) : null
  const ownEntry = leaderboard.find(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const earnedZkltc = ownEntry?.earnedZkltc ?? 0
  const earnedUsdc = ownEntry?.earnedUsdc ?? 0
  const jobsPaid = ownEntry?.jobsPaid ?? 0

  const dedupedJobs = [...new Map(onChainJobs.map(j => [j.id, j])).values()]
  const usdRate = (t: string | undefined) => t === 'USDC' ? 1 : (ltcPrice ?? 0)
  const topReward = [...dedupedJobs].sort((a, b) => (b.reward * usdRate(b.tokenSymbol)) - (a.reward * usdRate(a.tokenSymbol))).slice(0, 8)
  const topClaimed = [...dedupedJobs].filter(j => j.claimedCount > 0).sort((a, b) => b.claimedCount - a.claimedCount).slice(0, 8)

  const earnedUsd = (ltcPrice ?? 0) * earnedZkltc + earnedUsdc

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 24, color: '#fff' }}>Statistics Overview</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <EarnedCard label="My Earned" usd={earnedUsd} zkltc={earnedZkltc} usdc={earnedUsdc} ltcPrice={ltcPrice} />
        <StatCard label="My Completed" value={`${jobsPaid}`} />
        <StatCard label="My Completed" value={`${jobsPaid}`} />
        <StatCard label="On-Chain Jobs" value={`${onChainJobs.length}`} />
        <div style={{ background: '#111', padding: 20, border: '1px solid #2a2a2a', borderRadius: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.45, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Escrowed</div>
          <div style={{ fontSize: 22, color: '#4ade80', fontWeight: 700, marginTop: 4 }}>
            {totalEscrowedUsd !== null ? (totalEscrowedUsd < 1 ? '$' + totalEscrowedUsd.toFixed(2) : totalEscrowedUsd < 1000 ? '$' + totalEscrowedUsd.toFixed(0) : '$' + (totalEscrowedUsd / 1000).toFixed(1) + 'k') : '...'}
          </div>
          {totalEscrowedZkltc > 0 && <div style={{ fontSize: 11, color: '#ffd700', fontWeight: 600, marginTop: 4 }}>{totalEscrowedZkltc} zkLTC</div>}
          {totalEscrowedUsdc > 0 && <div style={{ fontSize: 11, color: '#2775ca', fontWeight: 600, marginTop: 2 }}>{totalEscrowedUsdc} USDC</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12, color: '#e0e0e0' }}>Top Jobs by Reward</h3>
          {topReward.length === 0 ? (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
              No on-chain jobs yet &mdash; post the first one!
            </div>
          ) : (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '8px 12px' }}>
              {topReward.map((j, i) => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderBottom: i < topReward.length - 1 ? '1px solid #1a1a1a' : 'none', fontSize: 12, gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
                  <span style={{ textAlign: 'right', flexShrink: 0, lineHeight: 1.5 }}>
                    <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 12 }}>{jobUsd(j.reward, j.tokenSymbol, ltcPrice)}</span>
                    <br />
                    <span style={{ color: j.tokenSymbol === 'USDC' ? '#2775ca' : '#ffd700', fontSize: 10, opacity: 0.7 }}>{j.reward} {j.tokenSymbol || 'zkLTC'}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12, color: '#e0e0e0' }}>Most Claimed Jobs</h3>
          {topClaimed.length === 0 ? (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
              No claims yet
            </div>
          ) : (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '8px 12px' }}>
              {topClaimed.map((j, i) => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderBottom: i < topClaimed.length - 1 ? '1px solid #1a1a1a' : 'none', fontSize: 12, gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
                  <span style={{ color: '#4ade80', fontWeight: 600, flexShrink: 0 }}>{j.claimedCount}/{j.maxWorkers}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function EarnedCard({ label, usd, zkltc, usdc, ltcPrice }: { label: string; usd: number; zkltc: number; usdc: number; ltcPrice: number | null }) {
  const usdStr = ltcPrice === null ? '...' : usd < 1 ? '$' + usd.toFixed(2) : usd < 1000 ? '$' + usd.toFixed(0) : '$' + (usd / 1000).toFixed(1) + 'k'
  return (
    <div style={{ background: '#111', padding: 20, border: '1px solid #2a2a2a', borderRadius: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.45, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, color: '#4ade80', fontWeight: 700, marginTop: 4 }}>{usdStr}</div>
      {zkltc > 0 && <div style={{ fontSize: 11, color: '#ffd700', fontWeight: 600, marginTop: 4 }}>{zkltc} zkLTC</div>}
      {usdc > 0 && <div style={{ fontSize: 11, color: '#2775ca', fontWeight: 600, marginTop: 2 }}>{usdc} USDC</div>}
      {zkltc === 0 && usdc === 0 && <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>No earnings yet</div>}
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: '#111', padding: 20, border: '1px solid #2a2a2a', borderRadius: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.45, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, color: highlight ? '#ffd700' : '#e0e0e0', fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  )
}
