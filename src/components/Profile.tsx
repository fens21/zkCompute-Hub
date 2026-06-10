import { useState } from 'react'
import type { Job, LeaderboardEntry, Tab } from '../types'
import { generateIdenticon, shorten, formatUsd, fmt } from '../utils'
import { useIsMobile } from '../hooks/useIsMobile'
import { colors, radii, fontSizes } from '../styles/tokens'

type Badge = { icon: string; label: string; desc: string; color: string }

function getBadges(jobsClaimed: number, jobsPaid: number, earnedZkltc: number, earnedUsdc: number, rank: number): Badge[] {
  const badges: Badge[] = []
  if (jobsClaimed >= 1)  badges.push({ icon: '', label: 'First Claim',    desc: 'Claimed your first job',          color: colors.green })
  if (jobsClaimed >= 5)  badges.push({ icon: '', label: 'Active Worker',  desc: '5+ jobs claimed',                 color: colors.gold })
  if (jobsClaimed >= 20) badges.push({ icon: '', label: 'Veteran',        desc: '20+ jobs claimed',                color: '#38bdf8' })
  if (jobsPaid >= 1)     badges.push({ icon: '', label: 'First Payment',  desc: 'Received first payment',          color: colors.green })
  if (jobsPaid >= 10)    badges.push({ icon: '', label: 'Top Earner',     desc: '10+ paid jobs',                   color: colors.gold })
  if (earnedZkltc >= 10) badges.push({ icon: '', label: 'zkLTC Holder',   desc: 'Earned 10+ zkLTC',                color: '#a78bfa' })
  if (earnedUsdc >= 100) badges.push({ icon: '', label: 'USDC Earner',    desc: 'Earned $100+ USDC',               color: colors.blue })
  if (rank === 1)         badges.push({ icon: '', label: 'Top Worker',     desc: '#1 on leaderboard',               color: colors.gold })
  if (rank === 2)         badges.push({ icon: '', label: 'Podium #2',      desc: 'Top 3 on leaderboard',            color: '#c0c0c0' })
  if (rank === 3)         badges.push({ icon: '', label: 'Podium #3',      desc: 'Top 3 on leaderboard',            color: '#cd7f32' })
  const successRate = jobsClaimed > 0 ? jobsPaid / jobsClaimed : 0
  if (successRate >= 0.9 && jobsClaimed >= 3) badges.push({ icon: '', label: 'Reliable',   desc: '90%+ success rate',  color: '#34d399' })
  return badges
}

const EXPLORER_URL = 'https://liteforge.explorer.caldera.xyz/address/'

export function Profile({ account, myJobs, bio, skills, avatarUrl, setEditBio, setShowEditProfile, leaderboard, ltcPrice, loading, onRetry, onNavigate }: {
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
  onNavigate?: (tab: Tab) => void
}) {
  const isMobile = useIsMobile()
  const [copied, setCopied] = useState(false)
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null)

  const ownEntry  = leaderboard.find(e => e.worker.toLowerCase() === account.toLowerCase())
  const rank      = leaderboard.findIndex(e => e.worker.toLowerCase() === account.toLowerCase()) + 1
  const points    = ownEntry?.points     ?? 0
  const jobsClaimed  = ownEntry?.jobsClaimed ?? 0
  const jobsPaid     = ownEntry?.jobsPaid    ?? 0
  const earnedZkltc  = ownEntry?.earnedZkltc ?? 0
  const earnedUsdc   = ownEntry?.earnedUsdc  ?? 0
  const earnedUsd    = ltcPrice !== null ? ltcPrice * earnedZkltc + earnedUsdc : earnedUsdc > 0 ? earnedUsdc : null
  const successRate  = jobsClaimed > 0 ? Math.round((jobsPaid / jobsClaimed) * 100) : 0
  const inProgress   = myJobs.filter(j => j.status === 'claimed').length
  const awaitingPayment = myJobs.filter(j => j.status === 'completed').length

  const recentActivity = Object.values(Object.fromEntries(myJobs.map(j => [j.id, j])))
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)

  const badges = getBadges(jobsClaimed, jobsPaid, earnedZkltc, earnedUsdc, rank)

  const rankColor = rank === 1 ? colors.gold : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : colors.textMuted
  const rankLabel = rank === 1 ? '🥇 #1 Top Worker' : rank === 2 ? '🥈 #2 Top Worker' : rank === 3 ? '🥉 #3 Top Worker' : rank > 0 ? `#${rank} Top Worker` : 'Unranked'

  const copyAddress = () => {
    navigator.clipboard.writeText(account)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayAvatar = avatarUrl || generateIdenticon(account)
  const hasEarnings = earnedZkltc + earnedUsdc > 0

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ background: colors.bgCard, padding: isMobile ? 16 : 28, border: `1px solid ${colors.borderLight}`, borderRadius: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={displayAvatar}
              alt="avatar"
              onLoad={e => (e.currentTarget.style.opacity = '1')}
              style={{ width: 64, height: 64, borderRadius: radii.xl, border: hasEarnings ? `2px solid ${colors.gold}` : `2px solid ${colors.borderLight}`, objectFit: avatarUrl ? 'cover' : 'none', imageRendering: avatarUrl ? 'auto' : 'pixelated', display: 'block', opacity: avatarUrl ? 0 : 1, transition: 'opacity 0.3s' }}
            />
            <div
              onClick={() => { setEditBio(bio); setShowEditProfile(true) }}
              role="button"
              aria-label="Edit profile"
              style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, background: colors.gold, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, lineHeight: 1, color: '#000' }}
            >✏️</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {shorten(account)}
            </div>
            <div style={{ color: rankColor, fontSize: fontSizes.base, marginTop: 2 }}>{rankLabel}</div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                onClick={copyAddress}
                aria-label={copied ? 'Address copied' : 'Copy wallet address'}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', minHeight: isMobile ? 44 : 'auto', background: copied ? '#1a3c1a' : colors.bgElevated, border: `1px solid ${copied ? colors.green : colors.border}`, color: copied ? colors.green : colors.textMuted, borderRadius: radii.sm, fontSize: fontSizes.sm, cursor: 'pointer' }}
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              <a
                href={`${EXPLORER_URL}${account}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on explorer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: colors.bgElevated, border: `1px solid ${colors.border}`, color: colors.textMuted, borderRadius: radii.sm, fontSize: fontSizes.sm, textDecoration: 'none' }}
              >
                View on Explorer
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {onRetry && <button onClick={onRetry} aria-label="Refresh profile" style={{ background: colors.bgElevated, color: colors.textMuted, border: 'none', width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, borderRadius: radii.sm, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh data">↻</button>}
            <button
              onClick={() => { setEditBio(bio); setShowEditProfile(true) }}
              aria-label="Edit profile"
              style={{ padding: '6px 14px', minHeight: isMobile ? 44 : 'auto', background: colors.bgElevated, border: `1px solid ${colors.border}`, color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.sm, cursor: 'pointer' }}
            >
              Edit Profile
            </button>
          </div>
        </div>

          {loading ? (
            <div>
              {['Earnings', 'Stats'].map((_section, row) => (
                <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: row === 0 ? 16 : 24 }}>
                  {['Rank', 'Points', 'Rate', 'Earned'].map(label => (
                    <div key={label} style={{ background: colors.bgCard, borderRadius: radii.md, padding: 12 }} aria-label={`Loading ${label}`}>
                      <div style={{ height: 10, width: '50%', background: colors.bgElevated, borderRadius: radii.sm, marginBottom: 8 }} />
                      <div style={{ height: 18, width: '30%', background: colors.bgElevated, borderRadius: radii.sm }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
              <MiniStat label="Rank"         value={rank > 0 ? `#${rank}` : '—'} color={rankColor} />
              <MiniStat label="Points"       value={`${points} pts`}              color="#F7CE3E" />
              <MiniStat label="Success Rate" value={`${successRate}%`}
                color={successRate >= 80 ? colors.green : successRate >= 50 ? colors.gold : jobsClaimed === 0 ? colors.textMuted : colors.red} />
              <div style={{ background: colors.bgCard, padding: 12, borderRadius: radii.md, textAlign: 'center' }}>
                <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Earned</div>
                <div style={{ fontSize: fontSizes.lg, fontWeight: 700, marginTop: 4, color: colors.green }}>
                  {formatUsd(earnedUsd)}
                </div>
                {earnedZkltc > 0 && <div style={{ fontSize: fontSizes.sm, color: colors.gold, fontWeight: 600 }}>{fmt(earnedZkltc)} zkLTC</div>}
                {earnedUsdc  > 0 && <div style={{ fontSize: fontSizes.sm, color: colors.blue, fontWeight: 600 }}>{fmt(earnedUsdc)} USDC</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
              <MiniStat label="Jobs Claimed" value={`${jobsClaimed}`} />
              <MiniStat label="Jobs Paid"    value={`${jobsPaid}`} />
              <MiniStat label="In Progress"  value={`${inProgress}`}       color={inProgress > 0 ? colors.gold : colors.textMuted} />
              <MiniStat label="Awaiting Pay" value={`${awaitingPayment}`}  color={awaitingPayment > 0 ? colors.orange : colors.textMuted} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.5, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Badges</div>
              {badges.length === 0 ? (
                <div style={{ fontSize: fontSizes.sm, opacity: 0.35, fontStyle: 'italic' }}>No badges yet — start claiming jobs!</div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
                  {badges.map((badge, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveBadge(activeBadge === badge ? null : badge)}
                      onMouseEnter={() => setActiveBadge(badge)}
                      onMouseLeave={() => setActiveBadge(null)}
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: colors.bgElevated, border: `1px solid ${badge.color}33`, borderRadius: radii.full, fontSize: fontSizes.sm, color: badge.color, cursor: 'default' }}
                    >
                      <span style={{ fontWeight: 600 }}>{badge.label}</span>
                      {activeBadge === badge && (
                        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: radii.sm, padding: '5px 10px', fontSize: fontSizes.xs, color: colors.textSecondary, whiteSpace: 'nowrap', zIndex: 10, marginBottom: 6 }}>
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
          <div style={{ fontSize: fontSizes.sm, opacity: 0.5, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Bio</div>
          {bio ? (
            <div style={{ fontSize: fontSizes.base, lineHeight: 1.7, opacity: 0.85 }}>{bio}</div>
          ) : (
            <div style={{ fontSize: fontSizes.sm, opacity: 0.35, fontStyle: 'italic' }}>
              No bio yet —{' '}
              <span onClick={() => { setEditBio(bio); setShowEditProfile(true) }} style={{ color: colors.gold, cursor: 'pointer', textDecoration: 'underline' }}>
                add one
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: fontSizes.sm, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Skills & Expertise</div>
          {skills.length === 0 ? (
            <div style={{ fontSize: fontSizes.sm, opacity: 0.35, fontStyle: 'italic' }}>
              No skills listed —{' '}
              <span onClick={() => { setEditBio(bio); setShowEditProfile(true) }} style={{ color: colors.gold, cursor: 'pointer', textDecoration: 'underline' }}>
                add skills
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skills.map((s, i) => (
                <span key={i} style={{ background: colors.bgElevated, padding: '5px 13px', borderRadius: radii.full, fontSize: fontSizes.sm, border: `1px solid ${colors.border}` }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 16 }}>
          <div style={{ fontSize: fontSizes.sm, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Activity</div>
          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: fontSizes.sm, padding: '16px 0' }}>
              <span style={{ opacity: 0.35 }}>No activity yet — </span>
              {onNavigate && <span onClick={() => onNavigate('market')} style={{ color: colors.gold, cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>browse jobs</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentActivity.map((job, i) => (
                <div key={i} style={{ background: colors.bgCard, padding: '10px 14px', borderRadius: radii.sm, fontSize: fontSizes.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ opacity: 0.85 }}>{job.title.slice(0, 35)}{job.title.length > 35 ? '...' : ''}</span>
                  <span style={{
                    color: job.status === 'paid' ? colors.green : job.status === 'completed' ? colors.gold : job.status === 'disputed' ? colors.orange : colors.textMuted,
                    fontSize: fontSizes.sm, fontWeight: 600, whiteSpace: 'nowrap'
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

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: colors.bgCard, padding: 12, borderRadius: radii.md, textAlign: 'center' }}>
      <div style={{ fontSize: fontSizes.xs, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: fontSizes.lg, fontWeight: 700, marginTop: 4, color: color ?? colors.textPrimary }}>{value}</div>
    </div>
  )
}
