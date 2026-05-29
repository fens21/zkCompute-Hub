import type { Job } from '../types'
import { shorten } from '../utils'

export function MyJobs({ myJobs, address, onOpenProof, onUnclaim, onRelease, loading, onDispute, onResolveDispute }: {
  myJobs: Job[]
  address: string | undefined
  onOpenProof: (job: Job) => void
  onUnclaim: (jobId: number) => void
  onRelease: (job: Job) => void
  loading: boolean
  onDispute: (job: Job, worker?: string) => void
  onResolveDispute: (job: Job, acceptCancel: boolean) => void
}) {
  if (myJobs.length === 0) {
    return (
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 24 }}>My Jobs</h2>
        <div style={{ opacity: 0.6 }}>No jobs claimed yet</div>
      </div>
    )
  }

  const activeJobs = myJobs.filter(j => j.status === 'claimed')
  const completedJobs = myJobs.filter(j => j.status === 'completed')
  const paidJobs = myJobs.filter(j => j.status === 'paid')

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 24 }}>My Jobs</h2>

      {activeJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>In Progress</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {activeJobs.map(job => (
              <div key={job.id} style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{job.title}</div>
                <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{job.reward} {job.tokenSymbol || 'zkLTC'}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onOpenProof(job)} style={{ flex: 1, background: '#ffd700', color: '#000', border: 'none', padding: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}>SUBMIT PROOF</button>
                  <button onClick={() => onUnclaim(job.id)} style={{ flex: 1, background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer' }}>UNCLAIM</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>Proof Submitted &mdash; Awaiting Payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {completedJobs.map(job => {
              const isPoster = address?.toLowerCase() === job.poster.toLowerCase()
              return (
                <div key={job.id} style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, opacity: 0.85 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{job.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>Worker: {shorten(address || '')}</div>
                  <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{job.reward} {job.tokenSymbol || 'zkLTC'}</div>
                  {isPoster ? (
                    <button onClick={() => onRelease(job)} disabled={loading} style={{ width: '100%', background: '#4ade80', color: '#000', border: 'none', padding: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', marginBottom: 8 }}>
                      {loading ? 'PROCESSING...' : `RELEASE PAYMENT (+${job.reward} ${job.tokenSymbol || 'zkLTC'})`}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ background: '#2a2a1a', color: '#ffd700', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11 }}>
                        WAITING FOR POSTER TO RELEASE
                      </div>
                      <button onClick={() => onDispute(job)} style={{ background: 'transparent', color: '#f97316', border: '1px solid #f97316', padding: '8px 12px', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
                        FILE DISPUTE (Non-Payment)
                      </button>
                    </div>
                  )}
                  <div style={{ background: '#1a3c1a', color: '#4ade80', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11 }}>
                    PROOF SUBMITTED &mdash; AWAITING PAYMENT
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {myJobs.filter(j => j.status === 'disputed').length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12, color: '#f97316' }}>Disputed</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {myJobs.filter(j => j.status === 'disputed').map(job => (
              <div key={job.id} style={{ background: '#111', border: '1px solid #f97316', borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{job.title}</div>
                <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{job.reward} {job.tokenSymbol || 'zkLTC'}</div>
                <div style={{ background: '#2a1a0a', color: '#f97316', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600, fontSize: 11, marginBottom: 8 }}>
                  DISPUTE ACTIVE
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onResolveDispute(job, true)} style={{ flex: 1, padding: 10, background: '#f97316', color: '#000', border: 'none', fontWeight: 700, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    ACCEPT CANCEL
                  </button>
                  <button onClick={() => onResolveDispute(job, false)} style={{ flex: 1, padding: 10, background: 'transparent', color: '#4ade80', border: '1px solid #4ade80', fontWeight: 600, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    REJECT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {paidJobs.length > 0 && (
        <div>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>Paid</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {paidJobs.map(job => (
              <div key={job.id} style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24, opacity: 0.85 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{job.title}</div>
                <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{job.reward} {job.tokenSymbol || 'zkLTC'}</div>
                <div style={{ background: '#1a3c1a', color: '#4ade80', padding: '10px 14px', borderRadius: 6, textAlign: 'center', fontWeight: 600 }}>PAID</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
