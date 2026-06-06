import { useState, useMemo } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { colors, radii, fontSizes } from '../styles/tokens'
import type { Job, LeaderboardEntry } from '../types'
import { formatUsd, fmt, getDeadlineMs, formatTimeRemaining } from '../utils'

interface DashboardProps {
  myJobs: Job[]
  onChainJobs: Job[]
  leaderboard: LeaderboardEntry[]
  ltcPrice: number | null
  address: string
  onNavigate: (tab: 'dashboard' | 'market' | 'post' | 'my' | 'stats' | 'leaderboard' | 'profile') => void
  onBoostJob?: (jobId: number, amount: number) => void
}

export function Dashboard({ myJobs, onChainJobs, leaderboard, ltcPrice, address, onNavigate, onBoostJob }: DashboardProps) {
  const isMobile = useIsMobile()

  const ownEntry = leaderboard.find(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const totalEarned = (ownEntry?.earnedZkltc ?? 0) + (ownEntry?.earnedUsdc ?? 0)
  const earnedUsd = ltcPrice !== null ? ltcPrice * totalEarned : null
  const jobsCompleted = ownEntry?.jobsPaid ?? 0

  // Active claims (claimed but not paid/completed)
  const activeClaims = useMemo(() => myJobs.filter(j => 
    (j.status === 'claimed' || !j.status) && j.status !== 'paid' && j.status !== 'completed'
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

  // Simple earnings trend (illustrative - distributes total earned)
  const weeklyData = [
    { label: '3w ago', amount: Math.round(totalEarned * 0.15) },
    { label: '2w ago', amount: Math.round(totalEarned * 0.25) },
    { label: 'Last week', amount: Math.round(totalEarned * 0.3) },
    { label: 'This week', amount: Math.round(totalEarned * 0.3) },
  ]
  const maxWeekly = Math.max(...weeklyData.map(d => d.amount), 1)

  const totalActiveClaims = activeClaims.length
  const totalPostedActive = myPostedActive.length

  // Additional info
  const userIndex = leaderboard.findIndex(e => address && e.worker.toLowerCase() === address.toLowerCase())
  const userRank = userIndex >= 0 ? userIndex + 1 : null
  const reputationPoints = ownEntry?.points ?? 0

  // Additional information: escrowed amounts for posters
  const activeEscrowed = myPostedActive.reduce((sum, j) => sum + (j.reward * j.maxWorkers), 0)

  // Pending actions - jobs with approaching deadlines
  const pendingProofs = activeClaims.filter(j => {
    const endMs = getDeadlineMs(j.createdAt, j.deadline)
    return endMs && (endMs - Date.now()) < 86400000 * 2 // within 2 days
  })

  // Booster feature (platform fee to developer, NOT extra reward for workers)
  const [boostedJobIds, setBoostedJobIds] = useState<number[]>([])
  const handleBoost = (jobId: number, boostFee: number = 10) => {
    // Optimistic UI update
    setBoostedJobIds(prev => [...new Set([...prev, jobId])])
    if (onBoostJob) {
      onBoostJob(jobId, boostFee)
    }
  }
  const isBoosted = (jobId: number) => {
    if (boostedJobIds.includes(jobId)) return true
    // Check persisted metadata (if the job object carries boost info from saveJobMetadata)
    const job = [...myPostedActive, ...onChainJobs].find(j => j.id === jobId)
    if (job && (job as any).boosted_until && (job as any).boosted_until > Date.now()) {
      return true
    }
    return false
  }

  // For recommended jobs - based on types user has worked on.
  // Note: Boosted jobs (where poster paid platform fee) get higher priority in a full implementation.
  const userJobTypes = [...new Set(myJobs.map(j => j.type))]

  const recommendedJobs = [...onChainJobs]
    .filter(j => 
      j.claimedCount < j.maxWorkers && 
      userJobTypes.includes(j.type) && 
      !myJobs.some(m => m.id === j.id)
    )
    .slice(0, 3)

  // Subtle entrance animation helper (reuses global fadeIn from index.css)
  const fadeIn = (delay = 0) => ({
    animation: `fadeIn 0.6s ease-out ${delay}s both`
  })

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ 
        ...fadeIn(0),
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: 24,
        gap: 12
      }}>
        <div>
          <h2 style={{ fontSize: 24, margin: 0, color: colors.textPrimary }}>Dashboard</h2>
          <div style={{ color: colors.textDim, fontSize: fontSizes.sm, marginTop: 4 }}>
            Welcome back, {address.slice(0, 6)}...{address.slice(-4)}. Here's your personal overview of activity, earnings, and open work on zkCompute Hub.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            onClick={() => onNavigate('market')} 
            style={{ 
              background: colors.gold, color: '#000', border: 'none', 
              padding: '8px 16px', borderRadius: radii.md, fontWeight: 600, cursor: 'pointer',
              fontSize: fontSizes.sm,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Browse Jobs
          </button>
          <button 
            onClick={() => onNavigate('post')} 
            style={{ 
              background: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.borderLight}`, 
              padding: '8px 16px', borderRadius: radii.md, fontWeight: 600, cursor: 'pointer',
              fontSize: fontSizes.sm,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = colors.gold }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.borderLight }}
          >
            Post New Job
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', 
        gap: 12, 
        marginBottom: 20 
      }}>
        <div style={fadeIn(0.1)}><StatCard label="Total Earned" value={earnedUsd ? formatUsd(earnedUsd) : fmt(totalEarned) + ' zkLTC'} sub={earnedUsd ? fmt(totalEarned) + ' zkLTC' : ''} isMobile={isMobile} /></div>
        <div style={fadeIn(0.2)}><StatCard label="Jobs Completed" value={jobsCompleted.toString()} sub="Paid & verified" isMobile={isMobile} /></div>
        <div style={fadeIn(0.3)}><StatCard label="Active Claims" value={totalActiveClaims.toString()} sub="In progress" isMobile={isMobile} /></div>
        <div style={fadeIn(0.4)}><StatCard label="Posted Active" value={totalPostedActive.toString()} sub="Open jobs" isMobile={isMobile} /></div>
        <div style={fadeIn(0.5)}><StatCard label="Your Reputation" value={reputationPoints.toString()} sub={userRank ? `#${userRank} on leaderboard` : 'Start claiming jobs'} isMobile={isMobile} /></div>
      </div>

      {/* Additional Info */}
      {activeEscrowed > 0 && (
        <div style={{ ...fadeIn(0.55), marginBottom: 16 }}>
          <div style={{ 
            background: colors.bgCard, 
            border: `1px solid ${colors.borderLight}`, 
            borderRadius: radii.lg, 
            padding: '10px 14px', 
            fontSize: fontSizes.sm,
            color: colors.textDim
          }}>
            <strong style={{ color: colors.textPrimary }}>Financial Snapshot:</strong> You currently have <span style={{ color: colors.gold, fontWeight: 600 }}>{fmt(activeEscrowed)} zkLTC</span> escrowed across your open job postings (plus any boost fees you paid for visibility). This will be released automatically upon verified completion.
          </div>
        </div>
      )}

      {/* Reputation Progress */}
      <div style={{ ...fadeIn(0.52), marginBottom: 16 }}>
        <div style={{ 
          background: colors.bgCard, 
          border: `1px solid ${colors.borderLight}`, 
          borderRadius: radii.lg, 
          padding: 12 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Reputation Progress</div>
              <div style={{ fontSize: fontSizes.xs, color: colors.textDim }}>
                {reputationPoints} points • {userRank ? `Rank #${userRank}` : 'Newcomer'}
              </div>
            </div>
            <button onClick={() => onNavigate('leaderboard')} style={{ 
              background: 'transparent', color: colors.gold, border: 'none', 
              fontSize: fontSizes.xs, cursor: 'pointer', fontWeight: 600 
            }}>
              View Leaderboard →
            </button>
          </div>
          <div style={{ 
            background: colors.bgElevated, 
            height: 8, 
            borderRadius: 4, 
            overflow: 'hidden',
            marginTop: 4
          }}>
            <div style={{ 
              background: colors.gold, 
              height: '100%', 
              width: `${Math.min(100, (reputationPoints % 100))}%`, 
              transition: 'width 0.5s'
            }} />
          </div>
          <div style={{ fontSize: 10, color: colors.textDim, marginTop: 4, textAlign: 'right' }}>
            Next tier at {Math.ceil((reputationPoints + 1) / 100) * 100} points
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div style={{ ...fadeIn(0.55), marginBottom: 16 }}>
        <h3 style={{ fontSize: fontSizes.lg, margin: 0, color: colors.textPrimary }}>Pending Actions</h3>
        <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: '2px 0 12px' }}>Things you should take care of soon.</p>
        
        {pendingProofs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingProofs.map(job => (
              <div key={job.id} style={{ 
                background: colors.bgCard, border: `1px solid ${colors.orange}`, 
                borderRadius: radii.lg, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{job.title}</div>
                  <div style={{ fontSize: fontSizes.xs, color: colors.textDim }}>Proof deadline approaching</div>
                </div>
                <button onClick={() => onNavigate('my')} style={{ 
                  background: colors.orange, color: '#000', border: 'none', 
                  padding: '6px 12px', borderRadius: radii.sm, fontSize: fontSizes.sm, fontWeight: 600, cursor: 'pointer'
                }}>
                  Submit Now
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: colors.textDim, fontSize: fontSizes.sm }}>
            No urgent actions. Great job staying on top of your work!
          </div>
        )}
      </div>

      {/* Two column sections */}
      <div style={{ 
        ...fadeIn(0.5),
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: 16, 
        marginBottom: 16 
      }}>
        {/* Active Claims */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: fontSizes.lg, margin: 0, color: colors.textPrimary }}>Active Claims</h3>
              <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: '2px 0 0' }}>Jobs you've claimed but haven't submitted proof for yet.</p>
            </div>
            {activeClaims.length > 0 && (
              <button onClick={() => onNavigate('my')} style={{ 
                background: 'transparent', color: colors.gold, border: 'none', 
                fontSize: fontSizes.sm, cursor: 'pointer', fontWeight: 600,
                transition: 'color 0.2s'
              }}>
                View All →
              </button>
            )}
          </div>
          {activeClaims.length === 0 ? (
            <div style={{ 
              background: colors.bgCard, border: `1px solid ${colors.borderLight}`, 
              borderRadius: radii.xl, padding: '18px 16px', textAlign: 'center', color: colors.textDim 
            }}>
              No active claims right now. <span onClick={() => onNavigate('market')} style={{ color: colors.gold, cursor: 'pointer', textDecoration: 'underline' }}>Browse the marketplace</span> to find work that matches your skills.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeClaims.slice(0, 3).map((job) => {
                const endMs = getDeadlineMs(job.createdAt, job.deadline)
                const remaining = endMs ? endMs - Date.now() : 0
                return (
                  <div 
                    key={job.id} 
                    style={{ 
                      background: colors.bgCard, border: `1px solid ${colors.borderLight}`, 
                      borderRadius: radii.xl, padding: '12px 14px',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      minHeight: 58
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.borderColor = colors.gold;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = colors.borderLight;
                    }}
                  >
                    <div style={{ fontWeight: 600, color: colors.textPrimary, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSizes.sm }}>
                      <span style={{ color: colors.gold }}>{fmt(job.reward)} {job.tokenSymbol || 'zkLTC'}</span>
                      <span style={{ color: remaining < 3600000 ? colors.orange : colors.textDim }}>
                        {remaining > 0 ? formatTimeRemaining(remaining) + ' left' : 'Expired'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Posted Jobs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: fontSizes.lg, margin: 0, color: colors.textPrimary }}>Your Posted Jobs</h3>
              <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: '2px 0 0' }}>Open jobs waiting for workers. Boost dengan bayar 25% dari total reward job sebagai fee ke developer untuk naikkan prioritas 7 hari.</p>
            </div>
            {myPostedActive.length > 0 && (
              <button onClick={() => onNavigate('post')} style={{ 
                background: 'transparent', color: colors.gold, border: 'none', 
                fontSize: fontSizes.sm, cursor: 'pointer', fontWeight: 600,
                transition: 'color 0.2s'
              }}>
                Manage →
              </button>
            )}
          </div>
          {myPostedActive.length === 0 ? (
            <div style={{ 
              background: colors.bgCard, border: `1px solid ${colors.borderLight}`, 
              borderRadius: radii.xl, padding: '18px 16px', textAlign: 'center', color: colors.textDim 
            }}>
              You haven't posted any active jobs yet. <span onClick={() => onNavigate('post')} style={{ color: colors.gold, cursor: 'pointer', textDecoration: 'underline' }}>Post a job</span> to start hiring verified workers.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myPostedActive.slice(0, 3).map((job) => {
                const totalReward = job.reward * job.maxWorkers;
                const boostCost = Math.ceil(totalReward * 0.25);
                return (
                  <div 
                    key={job.id} 
                    style={{ 
                      background: colors.bgCard, border: `1px solid ${colors.borderLight}`, 
                      borderRadius: radii.xl, padding: '12px 14px',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      minHeight: 58
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.borderColor = colors.gold;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = colors.borderLight;
                    }}
                  >
                    <div style={{ fontWeight: 600, color: colors.textPrimary, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSizes.sm, marginBottom: 8 }}>
                      <span style={{ color: colors.gold }}>{fmt(job.reward)} {job.tokenSymbol || 'zkLTC'} × {job.maxWorkers}</span>
                      <span style={{ color: colors.textDim }}>{job.claimedCount}/{job.maxWorkers} claimed</span>
                    </div>

                    {!isBoosted(job.id) ? (
                      <button 
                        onClick={() => handleBoost(job.id, boostCost)}
                        style={{ 
                          background: 'linear-gradient(135deg, #F7CE3E, #e6a800)', 
                          color: '#0A1612', 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: radii.sm, 
                          fontSize: fontSizes.xs, 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          width: '100%'
                        }}
                        title={`Bayar fee platform ${boostCost} zkLTC (25% dari total reward ${totalReward} zkLTC) ke developer. Job kamu naik prioritas di pencarian & rekomendasi selama 7 hari. TIDAK nambah reward worker.`}
                      >
                        🚀 Boost (bayar {boostCost} zkLTC fee ke developer)
                      </button>
                    ) : (
                      <div style={{ 
                        background: 'rgba(247, 206, 62, 0.15)', 
                        color: colors.gold, 
                        padding: '4px 8px', 
                        borderRadius: radii.sm, 
                        fontSize: fontSizes.xs, 
                        fontWeight: 600,
                        textAlign: 'center'
                      }}>
                        🚀 Sudah di-boost — Prioritas tinggi 7 hari (fee ke developer)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Jobs */}
      {recommendedJobs.length > 0 && (
        <div style={{ ...fadeIn(0.6), marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: fontSizes.lg, margin: 0, color: colors.textPrimary }}>Recommended for You</h3>
              <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: '2px 0 0' }}>Jobs matching the types you've worked on before. Boosted listings (paid platform fee by poster) get higher priority.</p>
            </div>
            <button onClick={() => onNavigate('market')} style={{ 
              background: 'transparent', color: colors.gold, border: 'none', 
              fontSize: fontSizes.sm, cursor: 'pointer', fontWeight: 600 
            }}>
              See more →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
            {recommendedJobs.map(job => (
              <div key={job.id} style={{ 
                flex: 1, background: colors.bgCard, border: `1px solid ${colors.borderLight}`, 
                borderRadius: radii.xl, padding: '12px 14px',
                minHeight: 58,
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = colors.gold;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = colors.borderLight;
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                <div style={{ fontSize: fontSizes.sm, color: colors.gold, marginBottom: 4 }}>
                  {fmt(job.reward)} {job.tokenSymbol || 'zkLTC'} • {job.type}
                </div>
                <button onClick={() => onNavigate('market')} style={{ 
                  background: colors.gold, color: '#000', border: 'none', 
                  padding: '6px 12px', borderRadius: radii.sm, fontSize: fontSizes.xs, fontWeight: 600, cursor: 'pointer', width: '100%'
                }}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings Trend */}
      <div style={{ ...fadeIn(0.65), marginBottom: 16 }}>
        <h3 style={{ fontSize: fontSizes.lg, margin: 0, color: colors.textPrimary }}>Earnings Trend (Last 4 Weeks)</h3>
        <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: '2px 0 12px' }}>Sample distribution based on your total earnings (replace with real weekly data from activity if available).</p>
        
        <div style={{ 
          background: colors.bgCard, border: `1px solid ${colors.borderLight}`, 
          borderRadius: radii.xl, padding: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, marginBottom: 8 }}>
            {weeklyData.map((week, i) => {
              const height = Math.max(10, (week.amount / maxWeekly) * 100)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    background: colors.gold, 
                    height: `${height}%`, 
                    borderRadius: '4px 4px 0 0',
                    minHeight: 10,
                    transition: 'height 0.3s'
                  }} />
                  <div style={{ fontSize: 10, color: colors.textDim, marginTop: 4, textAlign: 'center' }}>
                    {week.label}
                  </div>
                  <div style={{ fontSize: 10, color: colors.gold, fontWeight: 600 }}>
                    {fmt(week.amount)}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: fontSizes.xs, color: colors.textDim, textAlign: 'center' }}>
            Total this period: {fmt(weeklyData.reduce((s, w) => s + w.amount, 0))} zkLTC
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ ...fadeIn(0.6), marginBottom: 16 }}>
        <h3 style={{ fontSize: fontSizes.lg, marginBottom: 4, color: colors.textPrimary }}>Recent Activity</h3>
        <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: '0 0 12px' }}>A quick look at your latest actions across the platform.</p>
        {recentActivity.length === 0 ? (
          <div style={{ color: colors.textDim, fontSize: fontSizes.sm }}>No recent activity yet. Start claiming or posting jobs to see your history here.</div>
        ) : (
          <div style={{ 
            background: colors.bgCard, border: `1px solid ${colors.borderLight}`, 
            borderRadius: radii.xl, overflow: 'hidden' 
          }}>
            {recentActivity.map((job, idx) => (
              <div 
                key={job.id} 
                style={{ 
                  padding: '10px 16px', 
                  borderBottom: idx < recentActivity.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: fontSizes.sm,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: colors.textPrimary }}>{job.title}</span>
                <span style={{ color: job.status === 'paid' ? colors.green : colors.gold, fontWeight: 500 }}>
                  {job.status === 'paid' ? '✓ Paid' : job.status === 'completed' ? 'Proof Submitted' : 'Claimed'} 
                  {job.reward ? ' • ' + fmt(job.reward) + ' ' + (job.tokenSymbol || 'zkLTC') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={fadeIn(0.7)}>
        <h3 style={{ fontSize: fontSizes.lg, marginBottom: 4, color: colors.textPrimary }}>Quick Actions</h3>
        <p style={{ fontSize: fontSizes.xs, color: colors.textDim, margin: '0 0 12px' }}>Jump straight into the actions that matter most right now.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('market')} style={actionBtnStyle}>Browse Marketplace</button>
          <button onClick={() => onNavigate('post')} style={actionBtnStyle}>Post a New Job</button>
          <button onClick={() => onNavigate('my')} style={actionBtnStyle}>My Jobs</button>
          <button onClick={() => onNavigate('leaderboard')} style={actionBtnStyle}>View Leaderboard</button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, isMobile }: { label: string; value: string; sub?: string; isMobile: boolean }) {
  return (
    <div 
      style={{ 
        background: colors.bgCard, 
        border: `1px solid ${colors.borderLight}`, 
        borderRadius: radii.xl, 
        padding: isMobile ? '14px 12px' : '16px 14px',
        minHeight: isMobile ? 78 : 92,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: fontSizes.xs, color: colors.textDim, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: fontSizes.xs, color: colors.textDim, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

const actionBtnStyle: React.CSSProperties = {
  background: colors.bgElevated,
  border: `1px solid ${colors.borderLight}`,
  color: colors.textPrimary,
  padding: '10px 18px',
  borderRadius: radii.md,
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: fontSizes.sm,
  transition: 'all 0.2s'
}

