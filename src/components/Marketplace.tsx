import type { Job, SortBy } from '../types'

export function Marketplace({ jobs, search, setSearch, typeFilter, setTypeFilter, sortBy, setSortBy, onClaim, onDetail, loading }: {
  jobs: Job[]
  search: string
  setSearch: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  sortBy: SortBy
  setSortBy: (v: SortBy) => void
  onClaim: (job: Job) => void
  onDetail: (job: Job) => void
  loading: boolean
}) {
  return (
    <>
      {(() => {
        const uniqueTypes = [...new Set(jobs.map(j => j.type))].sort()
        return uniqueTypes.length > 0 ? (
          <div style={{ background: 'linear-gradient(90deg, #1a1a2e, #16213e)', padding: 20, borderRadius: 12, marginBottom: 24, border: '1px solid #333' }}>
            <div style={{ color: '#ffd700', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {uniqueTypes.length} JOB TYPE{uniqueTypes.length > 1 ? 'S' : ''} AVAILABLE
            </div>
            <div style={{ fontSize: 14 }}>
              {uniqueTypes.join(' • ')}
            </div>
          </div>
        ) : null
      })()}

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0, color: '#fff' }}>Verifiable Compute Marketplace</h1>
        <p style={{ opacity: 0.7, marginTop: 4, fontSize: 12 }}>Earn zkLTC by running verified compute jobs</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: '#111', border: '1px solid #444', padding: '9px 14px', color: '#fff', width: 200, borderRadius: 6 }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ background: '#111', border: '1px solid #444', padding: '9px 14px', color: '#fff', borderRadius: 6 }}>
          <option value="">All Types</option>
          <option value="ML">ML</option>
          <option value="ZK">ZK</option>
          <option value="Render">Render</option>
          <option value="AI Inference">AI Inference</option>
          <option value="AI Training">AI Training</option>
          <option value="Scientific">Scientific</option>
          <option value="Data Labeling">Data Labeling</option>
          <option value="Video Transcoding">Video Transcoding</option>
          <option value="RAG Pipeline">RAG Pipeline</option>
          <option value="FHE">FHE</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} style={{ background: '#111', border: '1px solid #444', padding: '9px 14px', color: '#fff', borderRadius: 6 }}>
          <option value="reward">Sort: Reward</option>
          <option value="deadline">Sort: Deadline</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onClaim={onClaim} onDetail={onDetail} loading={loading} />
        ))}
      </div>
    </>
  )
}

function JobCard({ job, onClaim, onDetail, loading }: { job: Job; onClaim: (job: Job) => void; onDetail: (job: Job) => void; loading: boolean }) {
  const shorten = (addr: string) => addr.length > 10 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ background: '#333', color: '#ffd700', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{job.type}</div>
        <div style={{ color: '#ffd700', fontWeight: 700 }}>{job.difficulty}</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{job.title}</div>
      <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 16 }}>{job.description}</div>
      <div style={{ margin: '16px 0', fontSize: 20, color: '#ffd700', fontWeight: 700 }}>{job.reward} {job.tokenSymbol || 'zkLTC'}</div>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 16 }}>Posted by {shorten(job.poster)} &bull; {job.claimedCount}/{job.maxWorkers} claimed</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onDetail(job)} style={{ flex: 1, background: 'transparent', border: '1px solid #555', padding: '9px', color: '#c0c0c0', cursor: 'pointer' }}>DETAILS</button>
        <button onClick={() => onClaim(job)} disabled={loading} style={{ flex: 1, background: '#ffd700', color: '#000', border: 'none', padding: '9px', fontWeight: 700, cursor: 'pointer' }}>CLAIM</button>
      </div>
    </div>
  )
}
