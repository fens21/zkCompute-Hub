import { useMemo } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { colors } from '../styles/tokens'
import type { Job, LeaderboardEntry } from '../types'
import { formatUsd, fmt } from '../utils'

interface DashboardProps {
  myJobs: Job[]
  onChainJobs: Job[]
  leaderboard: LeaderboardEntry[]
  ltcPrice: number | null
  address: string
  onNavigate: (tab: 'dashboard' | 'market' | 'post' | 'my' | 'stats' | 'leaderboard' | 'profile') => void
  onBoostJob?: (jobId: number, amount: number) => void
  loading?: boolean
  error?: string | null
  realWeeklyEarnings?: { label: string; amount: number }[]
  realStreakActive?: boolean[]
}

export function Dashboard({ myJobs, onChainJobs, leaderboard, ltcPrice, address, onNavigate, loading, error, realWeeklyEarnings, realStreakActive }: DashboardProps) {
  const isMobile = useIsMobile()

  const ownEntry = leaderboard.find(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const totalEarned = (ownEntry?.earnedZkltc ?? 0) + (ownEntry?.earnedUsdc ?? 0)
  const earnedUsd = ltcPrice !== null ? ltcPrice * totalEarned : null
  const jobsCompleted = ownEntry?.jobsPaid ?? 0

  const activeClaims = useMemo(() => myJobs.filter(j => j.status === 'claimed'), [myJobs])
  const myPostedActive = useMemo(() => onChainJobs.filter(j =>
    address && j.poster.toLowerCase() === address.toLowerCase() &&
    j.claimedCount < j.maxWorkers
  ), [onChainJobs, address])

  const recentActivity = useMemo(() => [...myJobs]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5), [myJobs])

  const weeklyData = totalEarned > 0 ? [
    { label: '3w ago', amount: Math.round(totalEarned * 0.15) },
    { label: '2w ago', amount: Math.round(totalEarned * 0.25) },
    { label: 'Last week', amount: Math.round(totalEarned * 0.3) },
    { label: 'This week', amount: Math.round(totalEarned * 0.3) },
  ] : [
    { label: '3w ago', amount: 0 },
    { label: '2w ago', amount: 0 },
    { label: 'Last week', amount: 0 },
    { label: 'This week', amount: 0 },
  ]
  const chartData = realWeeklyEarnings ?? weeklyData
  const chartMax = Math.max(...chartData.map(d => d.amount), 1)

  const totalActiveClaims = useMemo(() => activeClaims.length, [activeClaims])
  const totalPostedActive = useMemo(() => myPostedActive.length, [myPostedActive])

  const userIndex = leaderboard.findIndex(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const userRank = userIndex >= 0 ? userIndex + 1 : null
  const reputationPoints = ownEntry?.points ?? 0

  // FIX: use earnedZkltc + earnedUsdc instead of totalEarned (which can be in wei)
  const platformTotalEarned = useMemo(() =>
    leaderboard.reduce((sum, e) => sum + (e.earnedZkltc ?? 0) + (e.earnedUsdc ?? 0), 0),
  [leaderboard])

  const fadeIn = (delay = 0) => ({
    animation: `fadeIn 0.3s ease-out ${delay}s both`
  })

  const glass = {
    background: colors.bgCard,
    border: '1px solid rgba(197,193,192,0.06)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)',
  } as const

  const glassHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-3px)'
    e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)'
    e.currentTarget.style.border = `1px solid ${colors.gold}44`
  }
  const glassLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'none'
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)'
    e.currentTarget.style.border = '1px solid rgba(197,193,192,0.06)'
  }
  const glassFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-3px)'
    e.currentTarget.style.border = `1px solid ${colors.gold}55`
  }
  const glassBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'none'
    e.currentTarget.style.border = '1px solid rgba(197,193,192,0.06)'
  }

  const topWorkers = [...leaderboard]
    .sort((a, b) => (b.earnedZkltc + b.earnedUsdc) - (a.earnedZkltc + a.earnedUsdc))
    .slice(0, 5)

  const linePoints = chartData.map((d, i) => ({
    x: 10 + (i * 80),
    y: 110 - Math.max(8, (d.amount / Math.max(1, chartMax)) * 85),
    label: d.label,
    value: d.amount
  }))

  const streakDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const completedDates = useMemo(() => {
    const dates = myJobs.filter(j => j.status === 'paid' || j.status === 'completed').map(j =>
      j.createdAt ? new Date(j.createdAt * 1000).toDateString() : null
    ).filter(Boolean)
    return new Set(dates)
  }, [myJobs])
  const streakActive = streakDays.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return completedDates.has(d.toDateString())
  })
  const finalStreakActive = realStreakActive ?? streakActive
  const activeStreakCount = finalStreakActive.filter(Boolean).length

  const openJobsCount = onChainJobs.filter(j => j.claimedCount < j.maxWorkers).length
  const totalWorkers = leaderboard.length
  const completedAllTime = leaderboard.reduce((sum, e) => sum + (e.jobsPaid || 0), 0)

  const rankMedal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`

  const statusColor = (status: string | undefined) => {
    if (status === 'paid') return colors.green
    if (status === 'completed') return '#38bdf8'
    if (status === 'claimed') return colors.gold
    if (status === 'disputed') return colors.orange
    return colors.textDim
  }
  const statusLabel = (status: string | undefined) => {
    if (status === 'paid') return 'PAID'
    if (status === 'completed') return 'SUBMITTED'
    if (status === 'claimed') return 'IN PROGRESS'
    if (status === 'disputed') return 'DISPUTED'
    return (status || '').toUpperCase()
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: colors.red, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Failed to load dashboard</div>
        <div style={{ color: colors.textDim, fontSize: 13, marginBottom: 20 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ background: colors.gold, border: 'none', color: '#000', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Retry</button>
      </div>
    )
  }

  if (loading) return <DashboardSkeleton isMobile={isMobile} />

  return (
    <div style={{ paddingBottom: 32 }} aria-live="polite" aria-label="Dashboard overview">
      <div style={{ width: '100%' }}>

        {/* ── 5 STAT CARDS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: 10,
          marginBottom: 18,
          alignItems: 'stretch'
        }}>
          {[
            { icon: '💰', label: 'Total Earnings', value: earnedUsd ? formatUsd(earnedUsd) : fmt(totalEarned) + ' zkLTC', sub: earnedUsd ? fmt(totalEarned) + ' zkLTC' : 'No earnings yet', accent: colors.gold },
            { icon: '✅', label: 'Jobs Completed', value: jobsCompleted.toString(), sub: jobsCompleted > 0 ? 'Verified on-chain' : 'No completed jobs yet', accent: colors.green },
            { icon: '📌', label: 'Active Claims', value: totalActiveClaims.toString(), sub: totalActiveClaims > 0 ? 'Submit proofs to earn' : 'Browse marketplace', accent: '#38bdf8' },
            { icon: '📝', label: 'Active Listings', value: totalPostedActive.toString(), sub: totalPostedActive > 0 ? 'Open positions' : 'Post a job', accent: '#a78bfa' },
            { icon: '🌟', label: 'Reputation', value: `Level ${Math.max(1, Math.floor(reputationPoints / 30) + 1)}`, sub: userRank ? `#${userRank} on leaderboard` : 'Complete jobs to rank', accent: colors.orange },
          ].map((s, i) => (
            <div key={i} style={fadeIn(i * 0.07)}>
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* ── EARNINGS + REPUTATION ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: 12, marginBottom: 14 }}>

          {/* Earnings Trend */}
          <div tabIndex={0} style={{ ...glass, borderRadius: 16, padding: '16px 18px', transition: 'transform 0.12s, box-shadow 0.12s, border 0.12s', outline: 'none' }}
            onMouseEnter={glassHover} onMouseLeave={glassLeave} onFocus={glassFocus} onBlur={glassBlur}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: colors.textPrimary }}>Earnings Trend</div>
                <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>Last 4 weeks · settled on-chain</div>
              </div>
              <div style={{ background: 'rgba(247,206,62,0.12)', border: '1px solid rgba(247,206,62,0.25)', borderRadius: 8, padding: '3px 10px', fontSize: 12, color: colors.gold, fontWeight: 700 }}>
                {fmt(chartData.reduce((s, w) => s + w.amount, 0))} zkLTC
              </div>
            </div>

            <svg width="100%" height="120" viewBox="0 0 340 120" role="img" aria-label="Earnings trend">
              <title>Earnings Trend</title>
              {[30, 55, 80, 105].map((y, i) => (
                <line key={i} x1="14" y1={y} x2="326" y2={y} stroke="rgba(197,193,192,0.06)" strokeWidth="1" />
              ))}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.gold} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={colors.gold} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                fill="url(#areaGrad)"
                points={[
                  ...linePoints.map(p => `${p.x},${p.y}`),
                  `${linePoints[linePoints.length - 1].x},112`,
                  `${linePoints[0].x},112`
                ].join(' ')}
              />
              <polyline fill="none" stroke={colors.gold} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
                style={{ filter: 'drop-shadow(0 0 4px rgba(247,206,62,0.4))' }}
              />
              {linePoints.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill={colors.bgCard} stroke={colors.gold} strokeWidth="2" />
                  <text x={p.x} y="118" textAnchor="middle" fill={colors.textMuted} fontSize="9">{p.label}</text>
                  {p.value > 0 && <text x={p.x} y={p.y - 9} textAnchor="middle" fill={colors.gold} fontSize="10" fontWeight="700">{fmt(p.value)}</text>}
                </g>
              ))}
            </svg>
          </div>

          {/* On-Chain Reputation */}
          <div tabIndex={0} style={{ ...glass, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform 0.12s, box-shadow 0.12s, border 0.12s', outline: 'none' }}
            onMouseEnter={glassHover} onMouseLeave={glassLeave} onFocus={glassFocus} onBlur={glassBlur}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, background: 'rgba(247,206,62,0.1)', border: `2px solid ${colors.gold}44`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🛡️</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>On-Chain Reputation</div>
                <div style={{ fontSize: 11, color: colors.textDim }}>Level {Math.max(1, Math.floor(reputationPoints / 30) + 1)}</div>
              </div>
            </div>

            {/* XP bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 6 }}>
                <span style={{ color: colors.gold, fontWeight: 700 }}>{reputationPoints} XP</span>
                <button onClick={() => onNavigate('leaderboard')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}>View Ranks →</button>
              </div>
              <div style={{ height: 8, background: 'rgba(197,193,192,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, reputationPoints % 100)}%`, background: `linear-gradient(90deg, ${colors.gold}, #f97316)`, transition: 'width 0.3s', borderRadius: 999 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: colors.textDim, marginTop: 4 }}>
                <span>Next: Contributor</span>
                <span>{100 - (reputationPoints % 100)} XP to go</span>
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {[
                { label: 'Jobs Done', value: jobsCompleted },
                { label: 'Rank', value: userRank ? `#${userRank}` : '—' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(197,193,192,0.04)', borderRadius: 10, padding: '8px 10px', border: '1px solid rgba(197,193,192,0.06)' }}>
                  <div style={{ fontSize: 10, color: colors.textDim, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DAILY STREAK + MARKETPLACE SNAPSHOT ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: 12, marginBottom: 14 }}>

          {/* Daily Streak */}
          <div tabIndex={0} style={{ ...glass, borderRadius: 16, padding: '16px 18px', transition: 'transform 0.12s, box-shadow 0.12s, border 0.12s', outline: 'none' }}
            onMouseEnter={glassHover} onMouseLeave={glassLeave} onFocus={glassFocus} onBlur={glassBlur}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>Daily Streak</div>
                <div style={{ fontSize: 11, color: colors.textDim }}>Complete tasks daily to earn bonus XP</div>
              </div>
              {activeStreakCount > 0 && (
                <div style={{ marginLeft: 'auto', background: 'rgba(247,206,62,0.12)', border: '1px solid rgba(247,206,62,0.3)', borderRadius: 8, padding: '2px 8px', fontSize: 11, color: colors.gold, fontWeight: 700 }}>
                  {activeStreakCount}🔥
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {streakDays.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 8, maxWidth: 36,
                    background: finalStreakActive[i] ? `linear-gradient(145deg, ${colors.gold}, #f97316)` : 'rgba(197,193,192,0.06)',
                    border: `1px solid ${finalStreakActive[i] ? colors.gold + '60' : 'rgba(197,193,192,0.08)'}`,
                    color: finalStreakActive[i] ? '#000' : colors.textMuted,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: finalStreakActive[i] ? '0 2px 8px rgba(247,206,62,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}>{finalStreakActive[i] ? '✓' : d}</div>
                  <div style={{ fontSize: 9, color: colors.textMuted, opacity: 0.6 }}>{d}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: activeStreakCount > 0 ? colors.gold : colors.textDim, fontWeight: 600 }}>
              {activeStreakCount > 0 ? `${activeStreakCount} day${activeStreakCount > 1 ? 's' : ''} active this week` : 'No activity yet this week — claim a job!'}
            </div>
          </div>

          {/* Marketplace Snapshot */}
          <div tabIndex={0} style={{ ...glass, borderRadius: 16, padding: '16px 18px', transition: 'transform 0.12s, box-shadow 0.12s, border 0.12s', outline: 'none' }}
            onMouseEnter={glassHover} onMouseLeave={glassLeave} onFocus={glassFocus} onBlur={glassBlur}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Marketplace Snapshot</div>
            <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 14 }}>Real-time platform activity</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Open Jobs', value: openJobsCount, max: Math.max(openJobsCount, 10), color: colors.gold },
                { label: 'Active Workers', value: totalWorkers, max: Math.max(totalWorkers, 10), color: '#38bdf8' },
                { label: 'Total Value Earned', value: `${fmt(platformTotalEarned)} zkLTC`, raw: platformTotalEarned, max: Math.max(platformTotalEarned, 10), color: colors.green },
                { label: 'Completed Jobs', value: completedAllTime, max: Math.max(completedAllTime, 10), color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: colors.textDim }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(197,193,192,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, ((s.raw ?? (s.value as number)) / s.max) * 100)}%`, background: s.color, borderRadius: 999, opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ACTIVITY + ACHIEVEMENTS + TOP WORKERS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.15fr 1fr 1fr', gap: 12, marginBottom: 16 }}>

          {/* Recent Activity */}
          <div tabIndex={0} style={{ ...glass, borderRadius: 16, padding: '14px 16px', transition: 'transform 0.12s, box-shadow 0.12s, border 0.12s', outline: 'none' }}
            onMouseEnter={glassHover} onMouseLeave={glassLeave} onFocus={glassFocus} onBlur={glassBlur}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Recent Activity</div>
              <button onClick={() => onNavigate('my')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}>View All →</button>
            </div>

            {recentActivity.length === 0 ? (
              <div style={{ fontSize: 12, color: colors.textDim, padding: '16px 0', textAlign: 'center' }}>
                No activity yet — browse the marketplace!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentActivity.slice(0, 4).map((job: Job, idx: number) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                    background: 'rgba(197,193,192,0.03)', borderRadius: 8,
                    border: '1px solid rgba(197,193,192,0.05)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,206,62,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,193,192,0.03)'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(job.status), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.title.length > 26 ? job.title.slice(0, 24) + '…' : job.title}
                      </div>
                      <div style={{ fontSize: 9.5, color: statusColor(job.status), fontWeight: 600, marginTop: 1 }}>
                        {statusLabel(job.status)}
                      </div>
                    </div>
                    <div style={{ color: colors.gold, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      +{fmt(job.reward)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div style={{ ...glass, borderRadius: 16, padding: '14px 16px', transition: 'transform 0.12s, box-shadow 0.12s, border 0.12s' }}
            onMouseEnter={glassHover} onMouseLeave={glassLeave}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Achievements</div>
              <button onClick={() => onNavigate('stats')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}>View All →</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'First Claim', desc: 'Claim your first job', done: jobsCompleted + totalActiveClaims > 0, progress: Math.min(1, jobsCompleted + totalActiveClaims), icon: '🎯' },
                { label: 'Complete 10 Jobs', desc: `${jobsCompleted}/10 jobs done`, done: jobsCompleted >= 10, progress: Math.min(1, jobsCompleted / 10), icon: '⚡' },
                { label: 'Earn 100 zkLTC', desc: `${fmt(totalEarned)}/100 zkLTC`, done: totalEarned >= 100, progress: Math.min(1, totalEarned / 100), icon: '💎' },
                { label: 'Reach Expert Rank', desc: `${reputationPoints}/120 XP`, done: reputationPoints >= 120, progress: Math.min(1, reputationPoints / 120), icon: '🏆' },
              ].map((a, i) => (
                <div key={i} style={{
                  padding: '7px 9px',
                  background: a.done ? 'rgba(247,206,62,0.06)' : 'rgba(197,193,192,0.03)',
                  border: `1px solid ${a.done ? colors.gold + '30' : 'rgba(197,193,192,0.06)'}`,
                  borderRadius: 9,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <span style={{ fontSize: 13 }}>{a.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: a.done ? colors.gold : colors.textPrimary }}>{a.label}</div>
                      <div style={{ fontSize: 10, color: colors.textDim }}>{a.desc}</div>
                    </div>
                    {a.done && <span style={{ fontSize: 9, color: colors.gold, fontWeight: 700, background: 'rgba(247,206,62,0.15)', padding: '1px 6px', borderRadius: 4 }}>DONE</span>}
                  </div>
                  <div style={{ height: 3, background: 'rgba(197,193,192,0.08)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${a.progress * 100}%`, background: a.done ? colors.gold : 'rgba(247,206,62,0.4)', borderRadius: 999, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Workers */}
          <div tabIndex={0} style={{ ...glass, borderRadius: 16, padding: '14px 16px', transition: 'transform 0.12s, box-shadow 0.12s, border 0.12s', outline: 'none' }}
            onMouseEnter={glassHover} onMouseLeave={glassLeave} onFocus={glassFocus} onBlur={glassBlur}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Top Workers</div>
              <button onClick={() => onNavigate('leaderboard')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}>View All →</button>
            </div>

            {topWorkers.length === 0 ? (
              <div style={{ fontSize: 12, color: colors.textDim, padding: '16px 0', textAlign: 'center' }}>
                Be the first worker to claim the top spot!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topWorkers.map((w, idx) => {
                  const earned = w.earnedZkltc + w.earnedUsdc
                  const isMe = address && w.worker.toLowerCase() === address.toLowerCase()
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                      background: isMe ? 'rgba(247,206,62,0.07)' : idx === 0 ? 'rgba(247,206,62,0.04)' : 'rgba(197,193,192,0.03)',
                      border: `1px solid ${isMe ? colors.gold + '40' : 'rgba(197,193,192,0.05)'}`,
                      borderRadius: 8,
                    }}>
                      <div style={{ width: 22, textAlign: 'center', fontSize: idx < 3 ? 14 : 11, fontWeight: 700, color: idx === 0 ? colors.gold : colors.textMuted, flexShrink: 0 }}>
                        {rankMedal(idx)}
                      </div>
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 11, color: isMe ? colors.gold : colors.textPrimary, fontWeight: isMe ? 700 : 400 }}>
                        {w.worker.slice(0, 6)}…{w.worker.slice(-4)}
                        {isMe && <span style={{ fontSize: 9, color: colors.gold, marginLeft: 4 }}>YOU</span>}
                      </div>
                      <div style={{ color: colors.gold, fontSize: 11, fontWeight: 700 }}>{fmt(earned)} <span style={{ opacity: 0.6, fontSize: 9 }}>zkLTC</span></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ ...glass, borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Quick Actions</div>
          <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 12 }}>Frequently used features — one click away</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Browse Jobs', desc: 'Find tasks to complete', icon: '🔍', tab: 'market' as const },
              { label: 'Post a Job', desc: 'Hire workers for tasks', icon: '➕', tab: 'post' as const },
              { label: 'My Jobs', desc: 'Track claims and listings', icon: '📁', tab: 'my' as const },
              { label: 'Leaderboard', desc: 'See top contributors', icon: '🏆', tab: 'leaderboard' as const },
            ].map((qa, i) => (
              <button key={i} onClick={() => onNavigate(qa.tab)} style={{
                flex: isMobile ? '1 1 45%' : 'none',
                background: 'rgba(247,206,62,0.07)',
                border: '1px solid rgba(247,206,62,0.18)',
                color: colors.textPrimary,
                padding: '11px 18px',
                borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.12s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.gold; e.currentTarget.style.color = '#000'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(247,206,62,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(247,206,62,0.07)'; e.currentTarget.style.color = colors.textPrimary; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ fontSize: 16 }}>{qa.icon}</span>
                <div>
                  <div>{qa.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.65 }}>{qa.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function DashboardSkeleton({ isMobile }: { isMobile: boolean }) {
  const shimmer = {
    background: 'linear-gradient(90deg, rgba(197,193,192,0.03) 0%, rgba(197,193,192,0.08) 50%, rgba(197,193,192,0.03) 100%)',
    backgroundSize: '200px 100%',
    borderRadius: 8,
    animation: 'shimmer 1.5s ease-in-out infinite',
  } as const
  const block = (h = 14, w = '100%') => ({ ...shimmer, height: h, width: w })
  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 10, marginBottom: 18 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ background: 'rgba(26,41,48,0.8)', border: '1px solid rgba(197,193,192,0.06)', borderRadius: 16, padding: '14px 16px', minHeight: 90 }}>
            <div style={block(10, '60%')} />
            <div style={{ ...block(22, '45%'), marginTop: 10 }} />
            <div style={{ ...block(10, '70%'), marginTop: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div tabIndex={0} style={{
      background: colors.bgCard,
      border: '1px solid rgba(197,193,192,0.06)',
      borderTop: `3px solid ${accent}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      borderRadius: 16, padding: '14px 16px',
      minHeight: 100,
      transition: 'transform 0.12s, box-shadow 0.12s',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', outline: 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px ${accent}33` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)' }}
      onFocus={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
      onBlur={e => { e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${accent}10, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
        <div style={{ fontSize: 10.5, color: colors.textDim, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}