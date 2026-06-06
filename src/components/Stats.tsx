import { useState, useEffect } from 'react'
import type { Job, LeaderboardEntry } from '../types'
import { colors, radii, fontSizes } from '../styles/tokens'
import { useIsMobile } from '../hooks/useIsMobile'
import { formatUsd, fmt } from '../utils'

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
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.red}`, borderRadius: radii.xl, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>!</div>
          <div style={{ opacity: 0.7, marginBottom: 16, fontSize: fontSizes.md }}>{error}</div>
          {onRetry && <button onClick={onRetry} style={{ background: colors.gold, color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: radii.md, cursor: 'pointer' }}>RETRY</button>}
        </div>
      </div>
    )
  }

  if (loading && onChainJobs.length === 0) {
    return (
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 24 }}>Statistics Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {['Earnings', 'Completed', 'On-Chain Jobs', 'Escrowed'].map(label => (
            <div key={label} style={{ background: colors.bgCard, borderRadius: radii.xl, padding: 20, border: `1px solid ${colors.borderLight}` }} aria-label={`Loading ${label}`}>
              <div style={{ height: 10, width: '40%', background: colors.bgElevated, borderRadius: radii.sm, marginBottom: 8 }} />
              <div style={{ height: 12, width: '60%', background: colors.bgElevated, borderRadius: radii.sm, marginBottom: 12 }} />
              <div style={{ height: 22, width: '35%', background: colors.bgElevated, borderRadius: radii.sm }} />
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
          {onRetry &&       <button onClick={onRetry} aria-label="Reload statistics" style={{ background: colors.bgElevated, color: colors.textMuted, border: 'none', width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh data">↻</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? 10 : 16, marginBottom: 28 }}>
        <StatCard
          label="My Earned"
          value={formatUsd(earnedUsd)}
          highlight={earnedZkltc + earnedUsdc > 0}
          isMobile={isMobile}
          sub={earnedZkltc + earnedUsdc > 0 ? (
            <>{earnedZkltc > 0 && <span style={{ color: colors.gold }}>{fmt(earnedZkltc)} zkLTC</span>}{earnedZkltc > 0 && earnedUsdc > 0 ? ' · ' : ''}{earnedUsdc > 0 && <span style={{ color: colors.blue }}>{fmt(earnedUsdc)} USDC</span>}</>
          ) : <span style={{ opacity: 0.4 }}>No earnings yet</span>}
        />
        <StatCard label="Jobs Paid" value={`${jobsPaid}`} isMobile={isMobile} sub={<span style={{ opacity: 0.5, fontSize: fontSizes.xs }}>completed &amp; paid by employer</span>} />
        <StatCard label="On-Chain Jobs" value={`${onChainJobs.length}`} isMobile={isMobile} />
        <StatCard
          label="Total Escrowed"
          value={formatUsd(totalEscrowedUsd)}
          isMobile={isMobile}
          sub={
            <>{totalEscrowedZkltc > 0 && <span style={{ color: colors.gold }}>{fmt(totalEscrowedZkltc)} zkLTC</span>}{totalEscrowedZkltc > 0 && totalEscrowedUsdc > 0 ? ' · ' : ''}{totalEscrowedUsdc > 0 && <span style={{ color: colors.blue }}>{fmt(totalEscrowedUsdc)} USDC</span>}</>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? 16 : 20 }}>

        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: fontSizes.lg, marginBottom: 12, color: colors.textPrimary }}>Top Jobs by Reward</h3>
          {rewardTotalPages > 1 && (
            <PaginationBar page={rewardPage} totalPages={rewardTotalPages} totalItems={topRewardAll.length} onPrev={() => setRewardPage(p => Math.max(0, p - 1))} onNext={() => setRewardPage(p => Math.min(rewardTotalPages - 1, p + 1))} isFirst={rewardPage === 0} isLast={rewardPage >= rewardTotalPages - 1} />
          )}
          {topReward.length === 0 ? (
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.xl, padding: 24, textAlign: 'center', opacity: 0.5, fontSize: fontSizes.md }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}></div>
              No on-chain jobs yet &mdash; post the first one!
            </div>
          ) : (
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.xl, padding: '8px 12px' }}>
                  {topReward.map((j, i) => (
                <div key={j.id} tabIndex={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderBottom: i < topReward.length - 1 ? `1px solid ${colors.bgElevated}` : 'none', fontSize: fontSizes.base, gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {j.type}
                    {j.title}
                  </span>
                  <span style={{ textAlign: 'right', flexShrink: 0, lineHeight: 1.5 }}>
                    <span style={{ color: colors.green, fontWeight: 600, fontSize: fontSizes.base }}>{ltcPrice ? formatUsd(j.reward * usdRate(j.tokenSymbol)) : `${fmt(j.reward)} ${j.tokenSymbol || 'zkLTC'}`}</span>
                    <br />
                    <span style={{ color: j.tokenSymbol === 'USDC' ? colors.blue : colors.gold, fontSize: fontSizes.xs, opacity: 0.7 }}>{fmt(j.reward)} {j.tokenSymbol || 'zkLTC'}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: fontSizes.lg, marginBottom: 12, color: colors.textPrimary }}>Most Claimed Jobs</h3>
          {claimedTotalPages > 1 && (
            <PaginationBar page={claimedPage} totalPages={claimedTotalPages} totalItems={topClaimedAll.length} onPrev={() => setClaimedPage(p => Math.max(0, p - 1))} onNext={() => setClaimedPage(p => Math.min(claimedTotalPages - 1, p + 1))} isFirst={claimedPage === 0} isLast={claimedPage >= claimedTotalPages - 1} />
          )}
          {topClaimed.length === 0 ? (
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.xl, padding: 24, textAlign: 'center', opacity: 0.5, fontSize: fontSizes.md }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}></div>
              No claims yet &mdash; jobs will appear here when workers claim them
            </div>
          ) : (
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.xl, padding: '8px 12px' }}>
                  {topClaimed.map((j, i) => (
                <div key={j.id} tabIndex={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 4px', borderBottom: i < topClaimed.length - 1 ? `1px solid ${colors.bgElevated}` : 'none', fontSize: fontSizes.base, gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {j.type}
                    {j.title}
                  </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 0 }}>
                      <span style={{ color: colors.green, fontWeight: 600, flexShrink: 0 }}>{j.claimedCount}/{j.maxWorkers}</span>
                      <div role="progressbar" aria-valuenow={j.claimedCount} aria-valuemax={j.maxWorkers} aria-label={`${j.claimedCount} of ${j.maxWorkers} slots filled`} style={{ flex: 1, height: 6, background: colors.bgElevated, borderRadius: radii.sm, overflow: 'hidden', minWidth: 40 }}>
                        <div style={{ width: `${Math.min(100, (j.claimedCount / Math.max(1, j.maxWorkers)) * 100)}%`, height: '100%', background: colors.green, borderRadius: radii.sm }} />
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

function PaginationBar({ page, totalPages, totalItems, onPrev, onNext, isFirst, isLast }: {
  page: number; totalPages: number; totalItems?: number; onPrev: () => void; onNext: () => void; isFirst: boolean; isLast: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '6px 12px', marginBottom: 10, border: `1px solid ${colors.borderLight}`, borderRadius: radii.md, background: colors.bgElevated }}>
      <button onClick={onPrev} disabled={isFirst} aria-label="Previous page" style={{ background: colors.bgElevated, color: isFirst ? colors.border : colors.textSecondary, border: `1px solid ${colors.borderLight}`, padding: '6px 12px', borderRadius: radii.sm, cursor: isFirst ? 'default' : 'pointer', fontSize: fontSizes.base, minHeight: isMobile ? 44 : 32 }}>← Prev</button>
      <span style={{ fontSize: fontSizes.base, opacity: 0.5 }}>Page {page + 1} of {totalPages}{totalItems ? ` (${totalItems} total)` : ''}</span>
      <button onClick={onNext} disabled={isLast} aria-label="Next page" style={{ background: colors.bgElevated, color: isLast ? colors.border : colors.textSecondary, border: `1px solid ${colors.borderLight}`, padding: '6px 12px', borderRadius: radii.sm, cursor: isLast ? 'default' : 'pointer', fontSize: fontSizes.base, minHeight: isMobile ? 44 : 32 }}>Next →</button>
    </div>
  )
}

function StatCard({ label, value, highlight, isMobile, sub }: { label: string; value: string; highlight?: boolean; isMobile?: boolean; sub?: React.ReactNode }) {
  return (
    <div style={{ background: colors.bgCard, padding: isMobile ? 14 : 20, border: `1px solid ${highlight ? colors.gold : colors.borderLight}`, borderRadius: radii.xl }}>
      <div style={{ fontSize: fontSizes.base, opacity: 0.45, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: isMobile ? 18 : 22, color: highlight ? colors.green : '#e0e0e0', fontWeight: 700, marginTop: 4, minHeight: '1.2em' }}>{value}</div>
      {sub && <div style={{ fontSize: fontSizes.sm, fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}
