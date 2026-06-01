import { useState } from 'react'
import type { Job, LeaderboardEntry } from '../types'
import { generateIdenticon, shorten } from '../utils'

type Badge = { icon: string; label: string; desc: string; color: string }

function getBadges(jobsClaimed: number, jobsPaid: number, earnedZkltc: number, earnedUsdc: number, rank: number): Badge[] {
  const badges: Badge[] = []
  if (jobsClaimed >= 1)  badges.push({ icon: '🚀', label: 'First Claim',    desc: 'Claimed your first job',          color: '#4ade80' })
  if (jobsClaimed >= 5)  badges.push({ icon: '⚡', label: 'Active Worker',  desc: '5+ jobs claimed',                 color: '#ffd700' })
  if (jobsClaimed >= 20) badges.push({ icon: '💎', label: 'Veteran',        desc: '20+ jobs claimed',                color: '#38bdf8' })
  if (jobsPaid >= 1)     badges.push({ icon: '✅', label: 'First Payment',  desc: 'Received first payment',          color: '#4ade80' })
  if (jobsPaid >= 10)    badges.push({ icon: '🏆', label: 'Top Earner',     desc: '10+ paid jobs',                   color: '#ffd700' })
  if (earnedZkltc >= 10) badges.push({ icon: '🔷', label: 'zkLTC Holder',   desc: 'Earned 10+ zkLTC',                color: '#a78bfa' })
  if (earnedUsdc >= 100) badges.push({ icon: '💵', label: 'USDC Earner',    desc: 'Earned $100+ USDC',               color: '#2775ca' })
  if (rank === 1)         badges.push({ icon: '👑', label: 'Top Worker',     desc: '#1 on leaderboard',               color: '#ffd700' })
  if (rank === 2)         badges.push({ icon: '🥈', label: 'Podium #2',      desc: 'Top 3 on leaderboard',            color: '#c0c0c0' })
  if (rank === 3)         badges.push({ icon: '🥉', label: 'Podium #3',      desc: 'Top 3 on leaderboard',            color: '#cd7f32' })
  const successRate = jobsClaimed > 0 ? jobsPaid / jobsClaimed : 0
  if (successRate >= 0.9 && jobsClaimed >= 3) badges.push({ icon: '🎯', label: 'Reliable',   desc: '90%+ success rate',  color: '#34d399' })
  return badges
}

const EXPLORER_URL = 'https://liteforge.explorer.caldera.xyz/address/'

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatUsd(usd: number, ltcPrice: number | null): string {
  if (ltcPrice === null) return '...'
  if (usd < 1) return '$' + usd.toFixed(2)
  if (usd < 1000) return '$' + usd.toFixed(0)
  return '$' + (usd / 1000).toFixed(1) + 'k'
}

export function Profile({ account, myJobs, bio, skills, avatarUrl, setEditBio, setShowEditProfile, leaderboard, ltcPrice, loading, onRetry }: {
  account: string
  myJobs: Job[]
  bio: string
  skills: string[]
  avatarUrl?: string
  setEditBio: (v: string) => void
  setShowEditProfile: (v: boolean) => void
  leaderboard: LeaderboardEntry[]
  ltcPrice: number | null
  loading?: boolean
  onRetry?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [tooltipBadge, setTooltipBadge] = useState<Badge | null>(null)
  const [clickedBadge, setClickedBadge] = useState<Badge | null>(null)

  const ownEntry  = leaderboard.find(e => e.worker.toLowerCase() === account.toLowerCase())
  const rank      = leaderboard.findIndex(e => e.worker.toLowerCase() === account.toLowerCase()) + 1
  const points    = ownEntry?.points     ?? 0
  const jobsClaimed  = ownEntry?.jobsClaimed ?? 0
  const jobsPaid     = ownEntry?.jobsPaid    ?? 0
  const earnedZkltc  = ownEntry?.earnedZkltc ?? 0
  const earnedUsdc   = ownEntry?.earnedUsdc  ?? 0
  const earnedUsd    = (ltcPrice ?? 0) * earnedZkltc + earnedUsdc
  const successRate  = jobsClaimed > 0 ? Math.round((jobsPaid / jobsClaimed) * 100) : 0
  const inProgress   = myJobs.filter(j => j.status === 'claimed').length
  const awaitingPayment = myJobs.filter(j => j.status === 'completed').length

  const recentActivity = Object.values(Object.fromEntries(myJobs.map(j => [j.id, j])))
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)

  const badges = getBadges(jobsClaimed, jobsPaid, earnedZkltc, earnedUsdc, rank)

  const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#888'
  const rankLabel = rank === 1 ? '🥇 #1 on Leaderboard' : rank === 2 ? '🥈 #2 on Leaderboard' : rank === 3 ? '🥉 #3 on Leaderboard' : rank > 0 ? `#${rank} on Leaderboard` : 'Unranked'

  const copyAddress = () => {
    navigator.clipboard.writeText(account)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayAvatar = avatarUrl || generateIdenticon(account)
  const hasEarnings = earnedZkltc + earnedUsdc > 0

  const showBadgeTooltip = (badge: Badge) => tooltipBadge === badge || clickedBadge === badge

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ background: '#111', padding: 28, border: '1px solid #333', borderRadius: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <img
            src={displayAvatar}
            alt="avatar"
            style={{ 
              width: 64, 
              height: 64, 
              borderRadius: 12, 
              border: hasEarnings ? '2px solid #ffd700' : '2px solid #333', 
              objectFit: avatarUrl ? 'cover' : 'none',
              imageRendering: avatarUrl ? 'auto' : 'pixelated', 
              flexShrink: 0 
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {shorten(account)}
            </div>
            <div style={{ color: rankColor, fontSize: 12, marginTop: 2 }}>{rankLabel}</div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                onClick={copyAddress}
                aria-label={copied ? 'Address copied' : 'Copy wallet address'}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: copied ? '#1a3c1a' : '#1a1a1a', border: `1px solid ${copied ? '#4ade80' : '#444'}`, color: copied ? '#4ade80' : '#aaa', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Address'}
              </button>
              <a
                href={`${EXPLORER_URL}${account}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on explorer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#1a1a1a', border: '1px solid #444', color: '#aaa', borderRadius: 6, fontSize: 11, textDecoration: 'none' }}
              >
                🔗 View on Explorer
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {onRetry && <button onClick={onRetry} aria-label="Refresh profile" style={{ background: '#222', color: '#888', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh">↻</button>}
            <button
              onClick={() => { setEditBio(bio); setShowEditProfile(true) }}
              aria-label="Edit profile"
              style={{ padding: '6px 14px', background: '#222', border: '1px solid #555', color: '#c0d8e8', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {loading ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: '#111', borderRadius: 8, padding: 12 }}>
                  <div style={{ height: 10, width: '50%', background: '#222', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 18, width: '30%', background: '#222', borderRadius: 4 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: '#111', borderRadius: 8, padding: 12 }}>
                  <div style={{ height: 10, width: '50%', background: '#222', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 18, width: '30%', background: '#222', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
              <MiniStat label="Rank"         value={rank > 0 ? `#${rank}` : '—'} color={rankColor} />
              <MiniStat label="Points"       value={`${points} pts`}              highlight />
              <MiniStat label="Success Rate" value={`${successRate}%`}
                color={successRate >= 80 ? '#4ade80' : successRate >= 50 ? '#ffd700' : jobsClaimed === 0 ? '#555' : '#ff6b6b'} />
              <div style={{ background: '#111', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Earned</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: '#4ade80' }}>
                  {earnedZkltc + earnedUsdc === 0 ? '—' : formatUsd(earnedUsd, ltcPrice)}
                </div>
                {earnedZkltc > 0 && <div style={{ fontSize: 11, color: '#ffd700', fontWeight: 600 }}>{fmt(earnedZkltc)} zkLTC</div>}
                {earnedUsdc  > 0 && <div style={{ fontSize: 11, color: '#2775ca', fontWeight: 600 }}>{fmt(earnedUsdc)} USDC</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
              <MiniStat label="Jobs Claimed" value={`${jobsClaimed}`} />
              <MiniStat label="Jobs Paid"    value={`${jobsPaid}`} />
              <MiniStat label="In Progress"  value={`${inProgress}`}       color={inProgress > 0 ? '#ffd700' : '#555'} />
              <MiniStat label="Awaiting Pay" value={`${awaitingPayment}`}  color={awaitingPayment > 0 ? '#f97316' : '#555'} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Badges</div>
              {badges.length === 0 ? (
                <div style={{ fontSize: 11, opacity: 0.35, fontStyle: 'italic' }}>No badges yet — start claiming jobs!</div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
                  {badges.map((badge, i) => (
                    <div
                      key={i}
                      onClick={() => setClickedBadge(clickedBadge === badge ? null : badge)}
                      onMouseEnter={() => setTooltipBadge(badge)}
                      onMouseLeave={() => setTooltipBadge(null)}
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#1a1a1a', border: `1px solid ${badge.color}33`, borderRadius: 999, fontSize: 11, color: badge.color, cursor: 'default' }}
                    >
                      <span>{badge.icon}</span>
                      <span style={{ fontWeight: 600 }}>{badge.label}</span>
                      {showBadgeTooltip(badge) && (
                        <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#222', border: '1px solid #444', borderRadius: 6, padding: '5px 10px', fontSize: 10, color: '#ccc', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                          {badge.desc}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Bio</div>
          {bio ? (
            <div style={{ fontSize: 12, lineHeight: 1.7, opacity: 0.85 }}>{bio}</div>
          ) : (
            <div style={{ fontSize: 11, opacity: 0.35, fontStyle: 'italic' }}>
              No bio yet —{' '}
              <span onClick={() => { setEditBio(bio); setShowEditProfile(true) }} style={{ color: '#ffd700', cursor: 'pointer', textDecoration: 'underline' }}>
                add one
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Skills & Expertise</div>
          {skills.length === 0 ? (
            <div style={{ fontSize: 11, opacity: 0.35, fontStyle: 'italic' }}>
              No skills listed —{' '}
              <span onClick={() => { setEditBio(bio); setShowEditProfile(true) }} style={{ color: '#ffd700', cursor: 'pointer', textDecoration: 'underline' }}>
                add skills
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skills.map((s, i) => (
                <span key={i} style={{ background: '#222', padding: '5px 13px', borderRadius: 999, fontSize: 11, border: '1px solid #444' }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #333', paddingTop: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Activity</div>
          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.35, fontSize: 11, padding: '16px 0' }}>
              No activity yet — claim a job to get started
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentActivity.map((job, i) => (
                <div key={i} style={{ background: '#111', padding: '10px 14px', borderRadius: 6, fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ opacity: 0.85 }}>{job.title.slice(0, 35)}{job.title.length > 35 ? '...' : ''}</span>
                  <span style={{
                    color: job.status === 'paid' ? '#4ade80' : job.status === 'completed' ? '#ffd700' : job.status === 'disputed' ? '#f97316' : '#888',
                    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap'
                  }}>
                    {job.status === 'paid'      ? `+${fmt(job.reward)} ${job.tokenSymbol || 'zkLTC'}` :
                     job.status === 'completed' ? 'PROOF SENT' :
                     job.status === 'disputed'  ? 'DISPUTED' : 'IN PROGRESS'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function MiniStat({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{ background: '#111', padding: 12, borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: color ?? (highlight ? '#ffd700' : '#c0c0c0') }}>{value}</div>
    </div>
  )
}
