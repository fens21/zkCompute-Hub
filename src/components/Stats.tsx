import { useState, useEffect } from 'react'
import type { Job, LeaderboardEntry } from '../types'
import { colors } from '../styles/tokens'
import { useIsMobile } from '../hooks/useIsMobile'

const JOB_TYPE_ICONS: Record<string, string> = {
  ML: '🧠', ZK: '🔐', Render: '🎬', 'AI Inference': '🤖',
  'AI Training': '🏋️', 'Data Labeling': '🏷️', 'Video Transcoding': '🎥',
  Scientific: '🔬', 'RAG Pipeline': '🔗', FHE: '🔒', Custom: '⚙️',
}

function formatUsd(usd: number | null): string {
  if (usd === null) return '—'
  if (usd < 1) return '$' + usd.toFixed(2)
  if (usd < 1000) return '$' + usd.toFixed(0)
  return '$' + (usd / 1000).toFixed(1) + 'k'
}

function rewardStr(r: number): string {
  return r.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Stats({ onChainJobs, leaderboard, ltcPrice, address, loading, error, onRetry }: {
  onChainJobs: Job[]
  leaderboard: LeaderboardEntry[]
  ltcPrice: number | null
  address: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}) {
  const isMobile = useIsMobile()
  const [rewardPage, setRewardPage] = useState(0)
  const [claimedPage, setClaimedPage] = useState(0)
  const PER_PAGE = 20

  const totalEscrowedZkltc = onChainJobs.filter(j => j.tokenSymbol !== 'USDC').reduce((s, j) => s + j.reward * j.maxWorkers, 0)
  const totalEscrowedUsdc = onChainJobs.filter(j => j.tokenSymbol === 'USDC').reduce((s, j) => s + j.reward * j.maxWorkers, 0)
  const totalEscrowedUsd = ltcPrice ? (totalEscrowedZkltc * ltcPrice + totalEscrowedUsdc) : null
  const ownEntry = leaderboard.find(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const earnedZkltc = ownEntry?.earnedZkltc ?? 0
  const earnedUsdc = ownEntry?.earnedUsdc ?? 0
  const jobsPaid = ownEntry?.jobsPaid ?? 0

  const dedupedJobs = [...new Map(onChainJobs.map(j => [j.id, j])).values()]
  const usdRate = (t: string | undefined) => t === 'USDC' ? 1 : (ltcPrice ?? 0)
  const topRewardAll = [...dedupedJobs].sort((a, b) => (b.reward * usdRate(b.tokenSymbol)) - (a.reward * usdRate(a.tokenSymbol)))
  const topClaimedAll = [...dedupedJobs].filter(j => j.claimedCount > 0).sort((a, b) => b.claimedCount - a.claimedCount)
  const rewardTotalPages = Math.max(1, Math.ceil(topRewardAll.length / PER_PAGE))
  const claimedTotalPages = Math.max(1, Math.ceil(topClaimedAll.length / PER_PAGE))
  const topReward = topRewardAll.slice(rewardPage * PER_PAGE, (rewardPage + 1) * PER_PAGE)
  const topClaimed = topClaimedAll.slice(claimedPage * PER_PAGE, (claimedPage + 1) * PER_PAGE)

  useEffect(() => {
    setRewardPage(0)
    setClaimedPage(0)
  }, [onChainJobs.length])

  const earnedUsd = ltcPrice !== null ? ltcPrice * earnedZkltc + earnedUsdc : null

  if (error) {
    return (
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 24 }}>Statistics Overview</h2>
        <div style={{ background: '#111', border: '1px solid #ff6b6b', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
          <div style={{ opacity: 0.7, marginBottom: 16, fontSize: 13 }}>{error}</div>
          {onRetry && <button onClick={onRetry} style={{ background: '#ffd700', color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>RETRY</button>}
        </div>
      </div>
    )
  }

  if (loading && onChainJobs.length === 0) {
    return (
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 24 }}>Statistics Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
              <div style={{ height: 12, width: '60%', background: '#222', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 24, width: '40%', background: '#222', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section aria-label="Statistics overview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ flex: 1 }} />
        <h2 style={{ fontSize: 20, margin: 0, color: colors.textPrimary, textAlign: 'center' }}>Statistics Overview</h2>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {onRetry && <button onClick={onRetry} aria-label="Refresh stats" style={{ background: '#222', color: '#888', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh">↻</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? 10 : 16, marginBottom: 28 }}>
        <StatCard
          label="My Earned"
          value={formatUsd(earnedUsd)}
          highlight={earnedZkltc + earnedUsdc > 0}
          isMobile={isMobile}
          sub={earnedZkltc + earnedUsdc > 0 ? (
            <>{earnedZkltc > 0 && <span style={{ color: '#ffd700' }}>{rewardStr(earnedZkltc)} zkLTC</span>}{earnedZkltc > 0 && earnedUsdc > 0 ? ' · ' : ''}{earnedUsdc > 0 && <span style={{ color: '#2775ca' }}>{rewardStr(earnedUsdc)} USDC</span>}</>
          ) : <span style={{ opacity: 0.4 }}>No earnings yet</span>}
        />
        <StatCard label="My Completed" value={`${jobsPaid}`} isMobile={isMobile} />
        <StatCard label="On-Chain Jobs" value={`${onChainJobs.length}`} isMobile={isMobile} />
        <StatCard
          label="Total Escrowed"
          value={formatUsd(totalEscrowedUsd)}
          isMobile={isMobile}
          sub={
            <>{totalEscrowedZkltc > 0 && <span style={{ color: '#ffd700' }}>{rewardStr(totalEscrowedZkltc)} zkLTC</span>}{totalEscrowedZkltc > 0 && totalEscrowedUsdc > 0 ? ' · ' : ''}{totalEscrowedUsdc > 0 && <span style={{ color: '#2775ca' }}>{rewardStr(totalEscrowedUsdc)} USDC</span>}</>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? 16 : 20 }}>

        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12, color: '#e0e0e0' }}>Top Jobs by Reward</h3>
          {rewardTotalPages > 1 && (
            <PaginationBar page={rewardPage} totalPages={rewardTotalPages} onPrev={() => setRewardPage(p => Math.max(0, p - 1))} onNext={() => setRewardPage(p => Math.min(rewardTotalPages - 1, p + 1))} isFirst={rewardPage === 0} isLast={rewardPage >= rewardTotalPages - 1} />
          )}
          {topReward.length === 0 ? (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
              No on-chain jobs yet &mdash; post the first one!
            </div>
          ) : (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '8px 12px' }}>
              {topReward.map((j, i) => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderBottom: i < topReward.length - 1 ? '1px solid #1a1a1a' : 'none', fontSize: 12, gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ marginRight: 6 }}>{JOB_TYPE_ICONS[j.type] || '📋'}</span>
                    {j.title}
                  </span>
                  <span style={{ textAlign: 'right', flexShrink: 0, lineHeight: 1.5 }}>
                    <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 12 }}>{ltcPrice ? formatUsd(j.reward * usdRate(j.tokenSymbol)) : `${rewardStr(j.reward)} ${j.tokenSymbol || 'zkLTC'}`}</span>
                    <br />
                    <span style={{ color: j.tokenSymbol === 'USDC' ? '#2775ca' : '#ffd700', fontSize: 10, opacity: 0.7 }}>{rewardStr(j.reward)} {j.tokenSymbol || 'zkLTC'}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12, color: '#e0e0e0' }}>Most Claimed Jobs</h3>
          {claimedTotalPages > 1 && (
            <PaginationBar page={claimedPage} totalPages={claimedTotalPages} onPrev={() => setClaimedPage(p => Math.max(0, p - 1))} onNext={() => setClaimedPage(p => Math.min(claimedTotalPages - 1, p + 1))} isFirst={claimedPage === 0} isLast={claimedPage >= claimedTotalPages - 1} />
          )}
          {topClaimed.length === 0 ? (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
              No claims yet
            </div>
          ) : (
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '8px 12px' }}>
              {topClaimed.map((j, i) => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderBottom: i < topClaimed.length - 1 ? '1px solid #1a1a1a' : 'none', fontSize: 12, gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ marginRight: 6 }}>{JOB_TYPE_ICONS[j.type] || '📋'}</span>
                    {j.title}
                  </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 0 }}>
                      <span style={{ color: '#4ade80', fontWeight: 600, flexShrink: 0 }}>{j.claimedCount}/{j.maxWorkers}</span>
                      <div style={{ flex: 1, height: 6, background: '#222', borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
                        <div style={{ width: `${Math.min(100, (j.claimedCount / Math.max(1, j.maxWorkers)) * 100)}%`, height: '100%', background: '#4ade80', borderRadius: 3 }} />
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}

function PaginationBar({ page, totalPages, onPrev, onNext, isFirst, isLast }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void; isFirst: boolean; isLast: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '6px 12px', marginBottom: 10, border: '1px solid #333', borderRadius: 8, background: '#1a1a1a' }}>
      <button onClick={onPrev} disabled={isFirst} aria-label="Previous page" style={{ background: '#222', color: isFirst ? '#444' : '#ccc', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: isFirst ? 'default' : 'pointer', fontSize: 12, minHeight: 32 }}>← Prev</button>
      <span style={{ fontSize: 12, opacity: 0.5 }}>Page {page + 1} of {totalPages}</span>
      <button onClick={onNext} disabled={isLast} aria-label="Next page" style={{ background: '#222', color: isLast ? '#444' : '#ccc', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: isLast ? 'default' : 'pointer', fontSize: 12, minHeight: 32 }}>Next →</button>
    </div>
  )
}

function StatCard({ label, value, highlight, isMobile, sub }: { label: string; value: string; highlight?: boolean; isMobile?: boolean; sub?: React.ReactNode }) {
  return (
    <div style={{ background: '#111', padding: isMobile ? 14 : 20, border: `1px solid ${highlight ? '#ffd700' : '#333'}`, borderRadius: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.45, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: isMobile ? 18 : 22, color: highlight ? '#4ade80' : '#e0e0e0', fontWeight: 700, marginTop: 4, minHeight: '1.2em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}
