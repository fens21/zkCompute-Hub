import { useState, useEffect } from 'react'
import { getProfile } from '../hooks/useWorkerProfiles'
import { fetchWorkerActivities } from '../hooks/useMyJobs'
import type { LeaderboardEntry, WorkerProfile, WorkerEvent } from '../types'
import { shorten, generateIdenticon } from '../utils'

function usdValue(entry: LeaderboardEntry | null, ltcPrice: number | null): string {
  if (!entry || ltcPrice === null) return '...'
  const v = entry.earnedZkltc * ltcPrice + entry.earnedUsdc
  if (v < 1) return '$' + v.toFixed(2)
  if (v < 1000) return '$' + v.toFixed(0)
  return '$' + (v / 1000).toFixed(1) + 'k'
}

export function WorkerProfileModal({ worker, leaderboardEntry, rank, onClose, ltcPrice }: {
  worker: string
  leaderboardEntry: LeaderboardEntry | null
  rank: number
  onClose: () => void
  ltcPrice: number | null
}) {
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [activities, setActivities] = useState<WorkerEvent[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  const avatarUrl = leaderboardEntry?.avatarUrl || profile?.avatarUrl
  const displayAvatar = avatarUrl || generateIdenticon(worker)

  useEffect(() => {
    setLoadingProfile(true)
    getProfile(worker).then(p => {
      setProfile(p)
      setLoadingProfile(false)
    })
  }, [worker])

  useEffect(() => {
    setLoadingActivities(true)
    fetchWorkerActivities(worker).then(acts => {
      setActivities(acts)
      setLoadingActivities(false)
    })
  }, [worker])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#888'
  const earnedSub = leaderboardEntry && (leaderboardEntry.earnedZkltc > 0 || leaderboardEntry.earnedUsdc > 0)
    ? `${leaderboardEntry.earnedZkltc > 0 ? leaderboardEntry.earnedZkltc + ' zkLTC' : ''}${leaderboardEntry.earnedZkltc > 0 && leaderboardEntry.earnedUsdc > 0 ? ' + ' : ''}${leaderboardEntry.earnedUsdc > 0 ? leaderboardEntry.earnedUsdc + ' USDC' : ''}`
    : undefined

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} role="dialog" aria-modal="true" aria-label={`Worker profile: ${shorten(worker)}`}>
      <div style={{ background: '#111', border: '1px solid #444', padding: 32, borderRadius: 16, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <img
            src={displayAvatar}
            alt={`Avatar for ${shorten(worker)}`}
            style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 10, 
              border: '2px solid #333', 
              objectFit: avatarUrl ? 'cover' : 'none',
              imageRendering: avatarUrl ? 'auto' : 'pixelated', 
              flexShrink: 0 
            }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, wordBreak: 'break-all' }}>{shorten(worker)}</div>
            <a
              href={`https://liteforge.explorer.caldera.xyz/address/${worker}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${shorten(worker)} on explorer`}
              style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace', color: '#aaa', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffd700')}
              onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
            >
              {worker.slice(0, 8)}...{worker.slice(-6)} 🔗
            </a>
            {rank > 0 && (
              <div style={{ fontSize: 11, color: rankColor, marginTop: 2 }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅'} #{rank} on Leaderboard
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close worker profile" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}>&times;</button>
        </div>

        {leaderboardEntry && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            <MiniStat label="Rank"   value={`#${rank}`}                           color={rankColor} />
            <MiniStat label="Points" value={`${leaderboardEntry.points}`}         highlight />
            <div style={{ background: '#1a1a1a', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Earned</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: '#4ade80' }}>{usdValue(leaderboardEntry, ltcPrice)}</div>
              {leaderboardEntry && leaderboardEntry.earnedZkltc > 0 && <div style={{ fontSize: 10, color: '#ffd700', marginTop: 2 }}>{leaderboardEntry.earnedZkltc} zkLTC</div>}
              {leaderboardEntry && leaderboardEntry.earnedUsdc > 0 && <div style={{ fontSize: 10, color: '#2775ca', marginTop: 2 }}>{leaderboardEntry.earnedUsdc} USDC</div>}
            </div>
          </div>
        )}

        {loadingProfile ? (
          <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 20, textAlign: 'center', opacity: 0.5, fontSize: 11 }}>
            Loading profile...
          </div>
        ) : profile && (profile.bio || profile.skills?.length > 0) ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Bio</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.85 }}>
                {profile.bio || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>No bio set.</span>}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Skills & Expertise</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {profile.skills && profile.skills.length > 0
                  ? profile.skills.map((s, i) => (
                      <span key={i} style={{ background: '#222', padding: '5px 13px', borderRadius: 999, fontSize: 11, border: '1px solid #444' }}>{s}</span>
                    ))
                  : <span style={{ fontSize: 11, opacity: 0.4, fontStyle: 'italic' }}>No skills listed.</span>
                }
              </div>
            </div>
          </>
        ) : (
          <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 20, textAlign: 'center', opacity: 0.6, fontSize: 11 }}>
            This worker hasn't set up their profile yet.
          </div>
        )}

        <div style={{ borderTop: '1px solid #333', paddingTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <MiniStat label="Jobs Claimed" value={`${leaderboardEntry?.jobsClaimed ?? 0}`} />
            <MiniStat label="Jobs Paid"    value={`${leaderboardEntry?.jobsPaid ?? 0}`} />
            <div style={{ background: '#1a1a1a', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Earned</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: '#4ade80' }}>{usdValue(leaderboardEntry, ltcPrice)}</div>
              {leaderboardEntry && leaderboardEntry.earnedZkltc > 0 && <div style={{ fontSize: 10, color: '#ffd700', marginTop: 2 }}>{leaderboardEntry.earnedZkltc} zkLTC</div>}
              {leaderboardEntry && leaderboardEntry.earnedUsdc > 0 && <div style={{ fontSize: 10, color: '#2775ca', marginTop: 2 }}>{leaderboardEntry.earnedUsdc} USDC</div>}
            </div>
          </div>

            <div style={{ borderTop: '1px solid #222', paddingTop: 16 }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Activity</div>
            {loadingActivities ? (
              <div style={{ fontSize: 11, opacity: 0.4, textAlign: 'center', padding: '12px 0' }}>Loading...</div>
            ) : activities.length === 0 ? (
              <div style={{ fontSize: 11, opacity: 0.4, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>No activity yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(function() {
                  const seen = new Set<number>()
                  const uniq: typeof activities = []
                  for (const a of activities) {
                    if (seen.has(a.jobId)) continue
                    seen.add(a.jobId)
                    uniq.push(a)
                    if (uniq.length === 5) break
                  }
                  return uniq
                })().map((act, i) => (
                  <div key={i} style={{ background: '#1a1a1a', padding: '10px 14px', borderRadius: 6, fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ opacity: 0.85 }}>{act.title.slice(0, 28)}{act.title.length > 28 ? '...' : ''}</span>
                    <span style={{
                      color: act.status === 'paid' ? '#4ade80' : act.status === 'completed' ? '#ffd700' : '#888',
                      fontWeight: 600, whiteSpace: 'nowrap'
                    }}>
                      {act.status === 'paid' ? `+${act.reward} ${act.tokenSymbol}` : act.status === 'completed' ? 'PROOF SENT' : 'IN PROGRESS'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

function MiniStat({ label, value, highlight, color, sub }: {
  label: string; value: string; highlight?: boolean; color?: string; sub?: string
}) {
  return (
    <div style={{ background: '#1a1a1a', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: color ?? (highlight ? '#ffd700' : '#c0c0c0') }}>{value}</div>
      {sub && <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
