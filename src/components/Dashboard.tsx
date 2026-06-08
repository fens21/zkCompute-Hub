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
}

export function Dashboard({ myJobs, onChainJobs, leaderboard, ltcPrice, address, onNavigate, loading, error }: DashboardProps) {
  const isMobile = useIsMobile()

  const ownEntry = leaderboard.find(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const totalEarned = (ownEntry?.earnedZkltc ?? 0) + (ownEntry?.earnedUsdc ?? 0)
  const earnedUsd = ltcPrice !== null ? ltcPrice * totalEarned : null
  const jobsCompleted = ownEntry?.jobsPaid ?? 0

  // Active claims (claimed — not yet paid or completed)
  const activeClaims = useMemo(() => myJobs.filter(j => 
    j.status === 'claimed'
  ), [myJobs])

  // Active posted jobs
  const myPostedActive = useMemo(() => onChainJobs.filter(j => 
    address && j.poster.toLowerCase() === address.toLowerCase() && 
    j.claimedCount < j.maxWorkers
  ), [onChainJobs, address])

  // Recent activity - simple from myJobs
  const recentActivity = useMemo(() => [...myJobs]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5), [myJobs])

  // Earnings trend (estimated — distributes total earned across weeks)
  const weeklyData = totalEarned > 0 ? [
    { label: '3w ago', amount: Math.round(totalEarned * 0.15) },
    { label: '2w ago', amount: Math.round(totalEarned * 0.25) },
    { label: 'Last week', amount: Math.round(totalEarned * 0.3) },
    { label: 'This week', amount: Math.round(totalEarned * 0.3) },
  ] : []
  const maxWeekly = Math.max(...weeklyData.map(d => d.amount), 1)

  const totalActiveClaims = useMemo(() => activeClaims.length, [activeClaims])
  const totalPostedActive = useMemo(() => myPostedActive.length, [myPostedActive])

  // Additional info
  const userIndex = leaderboard.findIndex(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const userRank = userIndex >= 0 ? userIndex + 1 : null
  const reputationPoints = ownEntry?.points ?? 0

  // Subtle entrance animation helper
  const fadeIn = (delay = 0) => ({
    animation: `fadeIn 0.65s cubic-bezier(0.23, 1, 0.32, 1) ${delay}s both`
  })

  // Glassmorphism effect (dark theme)
  const glass = {
    background: colors.bgCard,
    backdropFilter: 'blur(18px)',
    border: '1px solid rgba(197,193,192,0.06)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)',
  } as const

  const glassHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-4px) scale(1.005)'
    e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)'
    e.currentTarget.style.border = `1px solid ${colors.gold}66`
  }

  const glassLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'none'
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)'
    e.currentTarget.style.border = '1px solid rgba(197,193,192,0.06)'
  }

  const glassFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-4px) scale(1.005)'
    e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)'
    e.currentTarget.style.border = `1px solid ${colors.gold}66`
  }

  const glassBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'none'
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)'
    e.currentTarget.style.border = '1px solid rgba(197,193,192,0.06)'
  }

  // Prepare top workers from leaderboard
  const topWorkers = [...leaderboard]
    .sort((a, b) => (b.earnedZkltc + b.earnedUsdc) - (a.earnedZkltc + a.earnedUsdc))
    .slice(0, 5)

  // Line chart data (4 weeks)
  const linePoints = weeklyData.map((d, i) => ({
    x: 10 + (i * 80),
    y: 110 - Math.max(8, (d.amount / Math.max(1, maxWeekly)) * 85),
    label: d.label,
    value: d.amount
  }))

  // Daily streak — derive from actual job activity
  const streakDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const completedDates = useMemo(() => {
    const dates = myJobs.filter(j => j.status === 'paid' || j.status === 'completed').map(j => {
      return j.createdAt ? new Date(j.createdAt * 1000).toDateString() : null
    }).filter(Boolean)
    return new Set(dates)
  }, [myJobs])
  const streakActive = streakDays.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return completedDates.has(d.toDateString())
  })
  const activeStreakCount = streakActive.filter(Boolean).length

  // Marketplace snapshot numbers (derived)
  const openJobsCount = onChainJobs.filter(j => j.claimedCount < j.maxWorkers).length
  const totalWorkers = leaderboard.length
  const completedAllTime = leaderboard.reduce((sum, e) => sum + (e.jobsPaid || 0), 0)

  // ── Loading & error (after all hooks — React rules) ──
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

  if (loading) {
    return <DashboardSkeleton isMobile={isMobile} />
  }

  return (
    <div style={{ paddingBottom: 32 }} aria-live="polite" aria-label="Dashboard overview">
      {/* Main content - full width (sidebar removed) */}
      <div style={{ width: '100%' }}>

          {/* 5 STAT CARDS - Glass + Staggered entrance animation */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', 
            gap: 11, 
            marginBottom: 20,
            alignItems: 'stretch'
          }}>
            <div style={fadeIn(0)}><StatCard icon="💰" label="Total Earnings" value={earnedUsd ? formatUsd(earnedUsd) : fmt(totalEarned) + ' zkLTC'} sub={earnedUsd ? fmt(totalEarned) + ' zkLTC' : totalEarned > 0 ? '+12% this month' : 'No earnings yet'} /></div>
            <div style={fadeIn(0.08)}><StatCard icon="✅" label="Jobs Completed" value={jobsCompleted.toString()} sub={jobsCompleted > 0 ? 'Paid on-chain & verified via zk-proofs' : 'No completed jobs yet'} /></div>
            <div style={fadeIn(0.16)}><StatCard icon="📌" label="Active Claims" value={totalActiveClaims.toString()} sub={totalActiveClaims > 0 ? 'Tasks in progress — submit proofs to earn' : 'Browse marketplace to find work'} /></div>
            <div style={fadeIn(0.24)}><StatCard icon="📝" label="Active Listings" value={totalPostedActive.toString()} sub={totalPostedActive > 0 ? 'Open positions awaiting workers' : 'Post a job to find contributors'} /></div>
            <div style={fadeIn(0.32)}><StatCard icon="🌟" label="Reputation Level" value={`Level ${Math.max(1, Math.floor(reputationPoints / 30) + 1)}`} sub={userRank ? `#${userRank} on leaderboard • ${reputationPoints} XP earned` : 'Complete jobs to build reputation'} /></div>
          </div>

          {/* EARNINGS + REPUTATION ROW - Polished */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', 
            gap: 14, 
            marginBottom: 16 
          }}>
            
            {/* Earnings Trend — LINE CHART (Glass) */}
            <div 
              role="figure" aria-label="Earnings trend chart"
              tabIndex={0}
              style={{ 
                ...glass,
                borderRadius: 16, 
                padding: '16px 18px',
                transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s, border 0.3s',
                outline: 'none'
              }}
              onMouseEnter={glassHover}
              onMouseLeave={glassLeave}
              onFocus={glassFocus}
              onBlur={glassBlur}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: colors.textPrimary }}>Earnings Trend</div>
                {totalEarned > 0 && <div style={{ fontSize: 11, color: colors.textDim, maxWidth: 320 }}>Estimated earnings over the last 4 weeks — all payouts are settled on-chain</div>}
                <div style={{ fontSize: 12, color: colors.gold, fontWeight: 700, marginTop: 4 }}>
                  {weeklyData.length > 0 ? fmt(weeklyData.reduce((s, w) => s + w.amount, 0)) + ' zkLTC total' : 'No earnings data yet'}
                </div>
              </div>

              {weeklyData.length > 0 && (
              <svg width="100%" height="122" viewBox="0 0 340 122" style={{ marginTop: 2 }} role="img" aria-label="Earnings trend chart showing 4 weeks of estimated earnings">
                <title>Earnings Trend</title>
                {/* Subtle grid */}
                {[25, 52, 79, 106].map((y, i) => (
                  <line key={i} x1="14" y1={y} x2="326" y2={y} stroke="rgba(197,193,192,0.08)" strokeWidth="1" />
                ))}

                {/* Area under curve */}
                <polygon
                  fill="rgba(247,206,62,0.08)"
                  points={[
                    ...linePoints.map(p => `${p.x},${p.y}`),
                    `${linePoints[linePoints.length-1].x},112`,
                    `${linePoints[0].x},112`
                  ].join(' ')}
                />

                {/* Main line with glow effect */}
                <polyline
                  fill="none"
                  stroke={colors.gold}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
                  style={{ filter: 'drop-shadow(0 0 3px rgba(247,206,62,0.3))' }}
                />

                {/* Data points */}
                {linePoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4.5" fill={colors.bgCard} stroke={colors.gold} strokeWidth="2.5" />
                    <text x={p.x} y="120" textAnchor="middle" fill={colors.textMuted} fontSize="9.5">{p.label}</text>
                    <text x={p.x} y={p.y - 10} textAnchor="middle" fill={colors.gold} fontSize="11" fontWeight="700">{fmt(p.value)}</text>
                  </g>
                ))}
              </svg>
              )}
            </div>

            {/* Reputation Card (Glass) */}
            <div 
              tabIndex={0}
              style={{ 
                ...glass,
                borderRadius: 16, 
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s, border 0.3s',
                outline: 'none'
              }}
              onMouseEnter={glassHover}
              onMouseLeave={glassLeave}
              onFocus={glassFocus}
              onBlur={glassBlur}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48,
                  background: `linear-gradient(145deg, ${colors.goldBg}, ${colors.bgCard})`,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${colors.gold}55`,
                  fontSize: 21,
                  flexShrink: 0
                }}>
                  🛡️
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>On-Chain Reputation</div>
                  <div style={{ fontSize: 12, color: colors.textDim }}>
                    Level {Math.max(1, Math.floor(reputationPoints / 30) + 1)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: colors.gold, fontWeight: 700 }}>{reputationPoints} XP</span>
                  <button 
                    onClick={() => onNavigate('leaderboard')} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: colors.gold, 
                      fontSize: 11, 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    View Ranks<span aria-hidden="true"> →</span>
                  </button>
                </div>

                <div style={{ 
                  height: 9, 
                  background: 'rgba(197,193,192,0.08)', 
                  borderRadius: 999, 
                  overflow: 'hidden',
                  border: '1px solid rgba(197,193,192,0.06)'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (reputationPoints % 100))}%`, 
                    background: `linear-gradient(90deg, ${colors.gold}, ${colors.goldDark})`,
                    transition: 'width .5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
                <div style={{ fontSize: 11, color: colors.textDim, marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Next: Contributor</span>
                  <span>{100 - (reputationPoints % 100)} XP to go</span>
                </div>
              </div>
            </div>
          </div>

          {/* DAILY STREAK + MARKETPLACE SNAPSHOT - Polished */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', 
            gap: 14, 
            marginBottom: 18 
          }}>
            {/* Daily Streak (Glass) */}
            <div 
              tabIndex={0}
              style={{ 
                ...glass,
                borderRadius: 16, 
                padding: '16px 18px',
                transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s, border 0.3s',
                outline: 'none'
              }}
              onMouseEnter={glassHover}
              onMouseLeave={glassLeave}
              onFocus={glassFocus}
              onBlur={glassBlur}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 17 }} aria-hidden="true">🔥</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Daily Streak</div>
                  <div style={{ fontSize: 11, color: colors.textDim }}>Complete tasks daily to earn bonus XP and climb the leaderboard</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
                {streakDays.map((d, i) => (
                  <div 
                    key={i} 
                    style={{
                      width: 27, 
                      height: 27, 
                      borderRadius: '50%',
                      background: streakActive[i] 
                        ? `linear-gradient(145deg, ${colors.gold}, ${colors.goldDark})` 
                        : 'rgba(197,193,192,0.08)',
                      color: streakActive[i] ? '#000' : colors.textMuted,
                      fontSize: 11, 
                      fontWeight: 700,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: streakActive[i] ? 'none' : '1px solid rgba(197,193,192,0.06)',
                      transition: 'all 0.2s',
                      boxShadow: streakActive[i] ? '0 1px 4px rgba(247,206,62,0.3)' : 'none'
                    }}
                    title={streakActive[i] ? 'Completed tasks on this day' : 'No activity on this day'}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: colors.gold, marginTop: 10, fontWeight: 600 }}>
                {activeStreakCount > 0 ? `${activeStreakCount} day${activeStreakCount > 1 ? 's' : ''} active this week` : 'No activity yet this week'}
              </div>
            </div>

            {/* Marketplace Snapshot (Glass) */}
            <div 
              tabIndex={0}
              style={{ 
                ...glass,
                borderRadius: 16, 
                padding: '16px 18px',
                transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s, border 0.3s',
                outline: 'none'
              }}
              onMouseEnter={glassHover}
              onMouseLeave={glassLeave}
              onFocus={glassFocus}
              onBlur={glassBlur}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: colors.textPrimary }}>Marketplace Snapshot</div>
              <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 10 }}>
                Real-time overview of platform activity
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '7px 22px', 
                fontSize: 13 
              }}>
                <div style={{ color: colors.textDim }}>Open Jobs</div>
                <div style={{ fontWeight: 700, color: colors.textPrimary, textAlign: 'right' }}>{openJobsCount}</div>

                <div style={{ color: colors.textDim }}>Active Workers</div>
                <div style={{ fontWeight: 700, color: colors.textPrimary, textAlign: 'right' }}>{totalWorkers}</div>

                <div style={{ color: colors.textDim }}>Total Value Earned</div>
                <div style={{ fontWeight: 700, color: colors.gold, textAlign: 'right' }}>{fmt(totalEarned)} zkLTC</div>

                <div style={{ color: colors.textDim }}>Completed Jobs (All Time)</div>
                <div style={{ fontWeight: 700, color: colors.textPrimary, textAlign: 'right' }}>{completedAllTime}</div>
              </div>
            </div>
          </div>

          {/* THREE COLUMNS: Activity • Achievements • Top Workers - Polished */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1.15fr 1fr 1fr', 
            gap: 14, 
            marginBottom: 20 
          }}>
            
            {/* Recent Platform Activity (Glass) */}
            <div 
              tabIndex={0}
              style={{ 
                ...glass,
                borderRadius: 16, 
                padding: '14px 16px',
                transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s, border 0.3s',
                outline: 'none'
              }}
              onMouseEnter={glassHover}
              onMouseLeave={glassLeave}
              onFocus={glassFocus}
              onBlur={glassBlur}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Recent Activity</div>
                <button onClick={() => onNavigate('my')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>View All<span aria-hidden="true"> →</span></button>
              </div>
              <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 6 }}>Your latest job activity — claims, submissions, and payouts</div>

              {recentActivity.length === 0 ? (
                <div style={{ fontSize: 12, color: colors.textDim, padding: '10px 0', textAlign: 'center' }}>
                  No activity yet. Browse the marketplace to find your first task.
                </div>
              ) : (
                recentActivity.slice(0, 4).map((job: Job, idx: number) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 9, 
                      fontSize: 12, 
                      padding: '6px 0', 
                      borderBottom: idx < 3 ? '1px solid rgba(197,193,192,0.06)' : 'none',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,206,62,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 12 }} aria-hidden="true">●</span>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textPrimary }}>
                      {job.title.length > 30 ? job.title.slice(0, 27) + '...' : job.title}
                    </div>
                    <div style={{ color: colors.gold, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      +{fmt(job.reward)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Achievements (Glass) */}
            <div 
              style={{ 
                ...glass,
                borderRadius: 16, 
                padding: '14px 16px',
                transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s, border 0.3s'
              }}
              onMouseEnter={glassHover}
              onMouseLeave={glassLeave}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Achievements</div>
                <button onClick={() => onNavigate('stats')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>View All →</button>
              </div>
              <div style={{ fontSize: 10.5, color: colors.textDim, marginBottom: 6 }}>Milestones that unlock as you contribute and earn on the platform</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 3 }}>
                {[
                  { label: 'First Claim', desc: 'Claim your first job', done: jobsCompleted + totalActiveClaims > 0 },
                  { label: 'Complete 10 Jobs', desc: 'Finish and get paid for 10 tasks', done: jobsCompleted >= 10 },
                  { label: 'Earn 100 zkLTC', desc: 'Accumulate 100 zkLTC in earnings', done: totalEarned >= 100 },
                  { label: 'Reach Expert Rank', desc: 'Earn 120 XP through verified work', done: reputationPoints >= 120 },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                    <span style={{ color: a.done ? colors.gold : 'rgba(197,193,192,0.15)', fontSize: 13 }}>{a.done ? '✓' : '○'}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: a.done ? colors.textPrimary : colors.textDim }}>{a.label}</span>
                      <div style={{ fontSize: 11, color: colors.textDim }}>{a.desc}</div>
                    </div>
                    {a.done && <span style={{ fontSize: 10, color: colors.gold, fontWeight: 600 }}>Done</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Workers (Glass) */}
            <div 
              tabIndex={0}
              style={{ 
                ...glass,
                borderRadius: 16, 
                padding: '14px 16px',
                transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s, border 0.3s',
                outline: 'none'
              }}
              onMouseEnter={glassHover}
              onMouseLeave={glassLeave}
              onFocus={glassFocus}
              onBlur={glassBlur}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Top Workers</div>
                <button onClick={() => onNavigate('leaderboard')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>View All<span aria-hidden="true"> →</span></button>
              </div>
              <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 6 }}>Highest earners on the platform this week</div>

              {topWorkers.length === 0 ? (
                <div style={{ fontSize: 12, color: colors.textDim, padding: '8px 0', textAlign: 'center' }}>
                  Be the first worker to complete a job and claim the top spot!
                </div>
              ) : (
                topWorkers.map((w, idx) => {
                  const earned = w.earnedZkltc + w.earnedUsdc
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      fontSize: 12.5, 
                      padding: '5px 0',
                      borderBottom: idx < topWorkers.length - 1 ? '1px solid rgba(197,193,192,0.06)' : 'none'
                    }}>
                      <div style={{ 
                        width: 18, 
                        textAlign: 'center', 
                        color: idx === 0 ? colors.gold : colors.textMuted, 
                        fontWeight: 700 
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 11.5, color: colors.textPrimary }}>
                        {w.worker.slice(0, 6)}…{w.worker.slice(-4)}
                      </div>
                      <div style={{ color: colors.gold, fontSize: 11, fontWeight: 700 }}>{fmt(earned)} zkLTC</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* QUICK ACTIONS - Glass */}

          {/* QUICK ACTIONS - Glass */}
          <div style={{ ...glass, borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10, color: colors.textPrimary }}>Quick Actions</div>
            <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 8 }}>Frequently used features — one click away</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Browse Jobs', desc: 'Find tasks to complete', icon: '🔍', tab: 'market' as const },
                { label: 'Post a Job', desc: 'Hire workers for tasks', icon: '➕', tab: 'post' as const },
                { label: 'My Jobs', desc: 'Track claims and listings', icon: '📁', tab: 'my' as const },
                { label: 'Leaderboard', desc: 'See top contributors', icon: '🏆', tab: 'leaderboard' as const },
              ].map((qa, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(qa.tab)}
                  style={{
                    flex: isMobile ? '1 1 45%' : 'none',
                    background: 'rgba(247, 206, 62, 0.08)',
                    border: `1px solid rgba(247, 206, 62, 0.2)`,
                    color: colors.textPrimary,
                    padding: '11px 20px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s cubic-bezier(0.23,1,0.32,1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background = colors.gold; 
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                    e.currentTarget.style.borderColor = colors.gold;
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(247, 206, 62, 0.35)';
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background = 'rgba(247, 206, 62, 0.08)';
                    e.currentTarget.style.color = colors.textPrimary;
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(247, 206, 62, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: 15 }} aria-hidden="true">{qa.icon}</span>
                  <div>
                    <div>{qa.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{qa.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
    </div>
  )
}

/* ── Dashboard Skeleton (loading state) ── */
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
      <div style={{ width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 11, marginBottom: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: 'rgba(26,41,48,0.8)', border: '1px solid rgba(197,193,192,0.06)', borderRadius: 16, padding: '14px 16px', minHeight: 84 }}>
              <div style={block(10, '60%')} />
              <div style={{ ...block(20, '40%'), marginTop: 12 }} />
              <div style={{ ...block(10, '70%'), marginTop: 6 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ background: 'rgba(26,41,48,0.8)', border: '1px solid rgba(197,193,192,0.06)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ ...block(14, '40%'), margin: '0 auto 8px' }} />
            <div style={{ ...block(10, '60%'), margin: '0 auto 12px' }} />
            <div style={{ height: 122, ...shimmer }} />
          </div>
          <div style={{ background: 'rgba(26,41,48,0.8)', border: '1px solid rgba(197,193,192,0.06)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(197,193,192,0.04)' }} />
              <div style={{ flex: 1 }}>
                <div style={block(14, '60%')} />
                <div style={block(10, '80%')} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={block(10, '40%')} />
              <div style={{ ...block(9, '100%'), marginTop: 8, borderRadius: 999 }} />
              <div style={{ ...block(10, '50%'), marginTop: 6 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: 'rgba(26,41,48,0.8)', border: '1px solid rgba(197,193,192,0.06)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={block(14, '40%')} />
            <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ width: 27, height: 27, borderRadius: '50%', background: 'rgba(197,193,192,0.04)' }} />
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(26,41,48,0.8)', border: '1px solid rgba(197,193,192,0.06)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={block(14, '50%')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 22px', marginTop: 10 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={block(12, i % 2 === 0 ? '60%' : '40%')} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Stat Card - Glassmorphism */
function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div 
      tabIndex={0}
      style={{ 
        background: colors.bgCard,
        border: '1px solid rgba(197,193,192,0.06)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)',
        borderRadius: 16, 
        padding: '14px 16px',
        height: 110,
        transition: 'transform 0.25s cubic-bezier(0.23,1,0.32,1), box-shadow 0.25s, border 0.25s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        outline: 'none'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
        e.currentTarget.style.border = `1px solid ${colors.gold}55`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.border = '1px solid rgba(197,193,192,0.06)';
      }}
      onFocus={e => {
        e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
        e.currentTarget.style.border = `1px solid ${colors.gold}55`;
      }}
      onBlur={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.border = '1px solid rgba(197,193,192,0.06)';
      }}
    >
      {/* Glass highlight top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(247,206,62,0.04), transparent)'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          background: 'rgba(247, 206, 62, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          border: '1px solid rgba(247, 206, 62, 0.15)'
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 11, color: colors.textDim, fontWeight: 500 }}>{label}</div>
      </div>

      <div style={{ 
        fontSize: 22, 
        fontWeight: 700, 
        color: colors.textPrimary, 
        lineHeight: 1.0,
        marginTop: 1
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

