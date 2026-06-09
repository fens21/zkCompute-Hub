import { useState, useEffect, useRef } from 'react'
import { keccak256 } from 'viem'
import type { Job, NewJobForm, PostSubTab } from '../types'
import { JOB_TYPE_CONFIGS } from '../constants/jobTypes'
import { PostedJobCard } from './PostedJobCard'
import { SearchableSelect } from './SearchableSelect'
import { colors, radii, fontSizes, modalOverlay } from '../styles/tokens'
import { useIsMobile, useWindowWidth } from '../hooks/useIsMobile'
import { useFocusTrap } from '../hooks/useFocusTrap'

type ViewMode = 'grid' | 'list'

const TOKEN_SYMBOLS: Record<string, string> = { zkLTC: 'zkLTC', USDC: 'USDC', custom: 'CUSTOM' }
const TOKEN_COLORS: Record<string, string> = { zkLTC: colors.gold, USDC: colors.blue, custom: '#a855f7' }

export function PostJob({ postSubTab, setPostSubTab, newJob, setNewJob, postedJobs, onPost, onReleaseWorker, onDeactivate, onDispute, loading, deactivating, onEditPostedJob, editingPostedJob, editTitle, setEditTitle, editType, setEditType, editDesc, setEditDesc, editReqs, setEditReqs, editDeadline, setEditDeadline, editParameters, setEditParameters, editInputData, setEditInputData, editExpectedOutput, setEditExpectedOutput, editVerificationMethod, setEditVerificationMethod, onSaveEdit, onCancelEdit, editSaving, releaseRefreshKey }: {
  postSubTab: PostSubTab
  setPostSubTab: (v: PostSubTab) => void
  newJob: NewJobForm
  setNewJob: React.Dispatch<React.SetStateAction<NewJobForm>>
  postedJobs: Job[]
  onPost: () => void
  onReleaseWorker: (worker: string, j: Job) => void
  onDeactivate: (j: Job) => void
  onDispute: (j: Job, worker?: string) => void
  loading: boolean
  deactivating: boolean
  onEditPostedJob: (j: Job) => void
  editingPostedJob: Job | null
  editTitle: string
  setEditTitle: (v: string) => void
  editType: string
  setEditType: (v: string) => void
  editDesc: string
  setEditDesc: (v: string) => void
  editReqs: string
  setEditReqs: (v: string) => void
  editDeadline: string
  setEditDeadline: (v: string) => void
  editParameters: Record<string, string>
  setEditParameters: (v: Record<string, string>) => void
  editInputData: string
  setEditInputData: (v: string) => void
  editExpectedOutput: string
  setEditExpectedOutput: (v: string) => void
  editVerificationMethod: string
  setEditVerificationMethod: (v: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  editSaving: boolean
  releaseRefreshKey: number
}) {
  const windowWidth = useWindowWidth()
  const isMobile = useIsMobile()
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const [postedViewMode, setPostedViewMode] = useState<ViewMode>('grid')
  const [pendingTypeChange, setPendingTypeChange] = useState<string | null>(null)
  const [postSearch, setPostSearch] = useState('')
  const [postSort, setPostSort] = useState<'newest' | 'reward-desc' | 'reward-asc' | 'deadline' | 'type'>('newest')
  const prevEditTypeRef = useRef('')
 useEffect(() => {
  if (pendingTypeChange) return
  if (prevEditTypeRef.current && prevEditTypeRef.current !== editType) {
    setEditParameters({})
    const cfg = JOB_TYPE_CONFIGS[editType]
    if (cfg?.verificationOptions?.length) {
      setEditVerificationMethod(cfg.verificationOptions[0].value)
    }
  }
  prevEditTypeRef.current = editType
}, [editType, pendingTypeChange])

  const editDeadlineMs = editDeadline ? new Date(editDeadline).getTime() : NaN
  const editDeadlineInvalid = editDeadline ? isNaN(editDeadlineMs) : false
  const editDeadlinePast = !editDeadlineInvalid && !isNaN(editDeadlineMs) && editDeadlineMs <= Date.now()
  const editDeadlineSoon = !editDeadlineInvalid && !isNaN(editDeadlineMs) && editDeadlineMs > Date.now() && editDeadlineMs - Date.now() < 3600000
  const editDeadlineEmpty = !editDeadline?.trim()
  const editTitleEmpty = !editTitle.trim()
  const editCanSave = !editTitleEmpty && !editDeadlinePast && !editDeadlineInvalid && !editDeadlineEmpty

  return (
    <div>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, margin: 0, marginBottom: 12 }}>
          {postSubTab === 'new' ? 'Post New Compute Job' : 'Manage Posted Jobs'}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: colors.bgElevated, borderRadius: radii.md, padding: 4 }}>

            <button onClick={() => setPostSubTab('new')} aria-label="New Job tab" style={{
              flex: 1, padding: '7px 16px', borderRadius: radii.sm, cursor: 'pointer', fontWeight: 700, fontSize: fontSizes.sm, border: 'none',
              background: postSubTab === 'new' ? colors.gold : 'transparent',
              color: postSubTab === 'new' ? '#000' : colors.textMuted,
              transition: 'background 0.2s, color 0.2s',
            }}>+ NEW JOB</button>

            <button onClick={() => setPostSubTab('manage')} aria-label="Manage Posted tab" style={{
              flex: 1, padding: '7px 16px', borderRadius: radii.sm, cursor: 'pointer', fontWeight: 700, fontSize: fontSizes.sm, border: 'none',
              background: postSubTab === 'manage' ? colors.gold : 'transparent',
              color: postSubTab === 'manage' ? '#000' : colors.textMuted,
              transition: 'background 0.2s, color 0.2s',
            }}>MANAGE POSTED</button>
          </div>
        </div>
      </div>

      {postSubTab === 'new' ? (
        <NewJobForm newJob={newJob} setNewJob={setNewJob} onPost={onPost} loading={loading} isMobile={isMobile} />
      ) : (
        <div>
          {postedJobs.length === 0 ? (
            <div style={{ opacity: 0.7, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}></div>
              <div style={{ marginBottom: 16 }}>No posted jobs yet &mdash; post your first job!</div>
              <button onClick={() => setPostSubTab('new')} style={{ background: colors.gold, color: '#000', border: 'none', padding: '10px 24px', fontWeight: 700, borderRadius: radii.md, cursor: 'pointer', fontSize: fontSizes.base }}>
                + NEW JOB
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <input value={postSearch} onChange={e => setPostSearch(e.target.value)} placeholder="Search posted jobs..." aria-label="Search posted jobs" style={{ width: 160, background: '#000', border: `1px solid ${colors.border}`, padding: '7px 10px', color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.xs, boxSizing: 'border-box' }} />
                <select value={postSort} onChange={e => setPostSort(e.target.value as typeof postSort)} aria-label="Sort posted jobs" style={{ background: '#000', border: `1px solid ${colors.border}`, padding: '6px 8px', color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.xs }}>
                  <option value="reward-desc">Reward ↓</option>
                  <option value="reward-asc">Reward ↑</option>
                  <option value="deadline">Deadline</option>
                  <option value="type">Type</option>
                </select>
                <button onClick={() => setPostedViewMode('grid')} aria-label="Grid view" style={{ background: postedViewMode === 'grid' ? colors.gold : colors.bgElevated, color: postedViewMode === 'grid' ? '#000' : colors.textMuted, border: 'none', padding: '4px 10px', borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.xs, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Grid view">⊞ Grid</button>
                <button onClick={() => setPostedViewMode('list')} aria-label="List view" style={{ background: postedViewMode === 'list' ? colors.gold : colors.bgElevated, color: postedViewMode === 'list' ? '#000' : colors.textMuted, border: 'none', padding: '4px 10px', borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.xs, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="List view">≡ List</button>
              </div>
               {(() => {
                const query = postSearch.toLowerCase()
                let filtered = postedJobs.filter(j => j.title.toLowerCase().includes(query) || j.type.toLowerCase().includes(query))
                if (postSort === 'reward-desc') filtered = [...filtered].sort((a, b) => b.reward - a.reward)
                else if (postSort === 'reward-asc') filtered = [...filtered].sort((a, b) => a.reward - b.reward)
                else if (postSort === 'deadline') filtered = [...filtered].sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
                else if (postSort === 'type') filtered = [...filtered].sort((a, b) => a.type.localeCompare(b.type))
                else filtered = [...filtered].sort((a, b) => b.id - a.id)
                return filtered.length === 0 ? (
                  <div style={{ opacity: 0.5, padding: 40, textAlign: 'center', fontSize: fontSizes.sm }}>
                    {postSearch ? 'No jobs match your search.' : 'No posted jobs yet.'}
                  </div>
                ) : postedViewMode === 'list' ? (
                <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radii.xl, overflow: 'hidden' }}>
                  {filtered.map((job, i) => (
                    <div key={job.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                      <PostedJobCard job={job} onRelease={onReleaseWorker} onDeactivate={onDeactivate} onDispute={onDispute} loading={loading} deactivating={deactivating} onEdit={onEditPostedJob} view={postedViewMode} releaseRefreshKey={releaseRefreshKey} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="job-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 10 : 16 }}>
                  {filtered.map(job => (
                    <PostedJobCard key={job.id} job={job} onRelease={onReleaseWorker} onDeactivate={onDeactivate} onDispute={onDispute} loading={loading} deactivating={deactivating} onEdit={onEditPostedJob} view={postedViewMode} releaseRefreshKey={releaseRefreshKey} />
                  ))}
                </div>
              )})()}
            </div>
          )}
        </div>
      )}
      
      {editingPostedJob && <EditModalWrapper onClose={onCancelEdit}>
        <div onClick={e => e.stopPropagation()} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, padding: 28, borderRadius: radii.xl, maxWidth: 480, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Edit Job</h3>
              <button onClick={onCancelEdit} aria-label="Close edit modal" style={{ background: 'transparent', color: colors.textMuted, border: 'none', cursor: 'pointer', fontSize: 20, padding: '2px 6px', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: radii.sm }}>Only display data changes. On-chain data (reward, escrow) stays the same.</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Title</div>
              {editTitleEmpty && <div style={{ fontSize: 9, color: colors.red, marginBottom: 4 }}>Title is required</div>}
              <div style={{ position: 'relative' }}>
                <input maxLength={120} value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${editTitleEmpty ? colors.red : colors.border}`, padding: 10, color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.base, boxSizing: 'border-box', paddingRight: 40 }} />
                <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, opacity: 0.35 }}>{editTitle.length}/{120}</span>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Job Type</div>
              <SearchableTypeSelect
                value={editType}
                onChange={newType => {
                  const hasParams = Object.keys(editParameters).length > 0
                  if (hasParams && newType !== editType) {
                    setPendingTypeChange(newType)
                  } else {
                    setEditType(newType)
                  }
                }}
              />
              {pendingTypeChange && (
                <div style={{ marginTop: 6, padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: radii.sm, fontSize: fontSizes.xs }}>
                  <span style={{ opacity: 0.7 }}>Changing job type will reset all parameters.</span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button type="button" onClick={() => { setEditType(pendingTypeChange); setPendingTypeChange(null) }} style={{ padding: '4px 10px', background: colors.gold, color: '#000', border: 'none', borderRadius: radii.sm, fontWeight: 600, cursor: 'pointer', fontSize: 10 }}>CHANGE</button>
                    <button type="button" onClick={() => { setPendingTypeChange(null) }} style={{ padding: '4px 10px', background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: radii.sm, cursor: 'pointer', fontSize: 10 }}>KEEP</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Description</div>
              <textarea maxLength={2000} value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.base, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
              <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, opacity: 0.35 }}>{editDesc.length}/{2000}</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Requirements</div>
              <textarea maxLength={1000} value={editReqs} onChange={e => setEditReqs(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.base, minHeight: 70, boxSizing: 'border-box', resize: 'none' }} />
              <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, opacity: 0.35 }}>{editReqs.length}/{1000}</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Parameters</div>
              {(() => {
                const cfg = JOB_TYPE_CONFIGS[editType]
                if (!cfg) return null
                return cfg.fields.map(field => (
                  <div key={field.key} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>{field.label}</div>
                    <input
                      value={editParameters[field.key] || ''}
                      onChange={e => setEditParameters({ ...editParameters, [field.key]: e.target.value })}
                      style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 8, color: colors.textPrimary, fontSize: fontSizes.xs, borderRadius: radii.sm, boxSizing: 'border-box' }}
                    />
                  </div>
                ))
              })()}
              {Object.keys(editParameters).length > 0 && !JOB_TYPE_CONFIGS[editType] && (
                <div style={{ fontSize: 10, opacity: 0.5 }}>Custom parameters: {Object.keys(editParameters).join(', ')}</div>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Input Data / Payload</div>
              <textarea value={editInputData} onChange={e => setEditInputData(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 8, color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.xs, minHeight: 50, boxSizing: 'border-box', resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Expected Output</div>
              <textarea value={editExpectedOutput} onChange={e => setEditExpectedOutput(e.target.value)} style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 8, color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.xs, minHeight: 50, boxSizing: 'border-box', resize: 'none' }} />
              {editVerificationMethod === 'zk-proof' && (
                <div style={{ marginTop: 6, fontSize: 10, background: 'rgba(167,139,250,0.08)', border: '1px solid #a78bfa', padding: '6px 8px', borderRadius: radii.sm, color: '#c4b5fd' }}>
                  ZK: This should be the Poseidon target hash. Workers prove knowledge of the matching solution via ZK.
                </div>
              )}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Verification Method</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(JOB_TYPE_CONFIGS[editType]?.verificationOptions || [
                  { value: 'hash-check', label: 'Hash Check' },
                  { value: 'manual-review', label: 'Manual Review' },
                ]).map(opt => (
                  <label
                    key={opt.value}
                    style={{
                      flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 10px', background: editVerificationMethod === opt.value ? `${(JOB_TYPE_CONFIGS[editType]?.color || colors.gold)}22` : '#000',
                      border: `1px solid ${editVerificationMethod === opt.value ? (JOB_TYPE_CONFIGS[editType]?.color || colors.gold) : colors.border}`,
                      borderRadius: radii.sm, cursor: 'pointer', fontSize: fontSizes.xs,
                      color: editVerificationMethod === opt.value ? (JOB_TYPE_CONFIGS[editType]?.color || colors.gold) : colors.textPrimary,
                      fontWeight: editVerificationMethod === opt.value ? 700 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="editVerificationMethod"
                      value={opt.value}
                      checked={editVerificationMethod === opt.value}
                      onChange={e => setEditVerificationMethod(e.target.value)}
                      style={{ accentColor: JOB_TYPE_CONFIGS[editType]?.color || colors.gold }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: fontSizes.sm, opacity: 0.7, marginBottom: 4 }}>Deadline</div>
              <input
                type="datetime-local"
                value={editDeadline && editDeadline.length >= 16 ? editDeadline.slice(0, 16) : editDeadline || ''}
                onChange={e => setEditDeadline(e.target.value)}
                style={{ width: '100%', background: '#000', border: `1px solid ${editDeadlinePast ? colors.red : editDeadlineInvalid ? colors.orange : colors.border}`, padding: 10, color: colors.textPrimary, borderRadius: radii.sm, fontSize: fontSizes.base, boxSizing: 'border-box', colorScheme: 'dark' }}
              />
              {editDeadlinePast ? (
                <div style={{ fontSize: 9, color: colors.red, marginTop: 2 }}>Deadline must be in the future</div>
              ) : editDeadlineInvalid ? (
                <div style={{ fontSize: 9, color: colors.orange, marginTop: 2 }}>Invalid date format</div>
              ) : editDeadlineEmpty ? (
                <div style={{ fontSize: 9, color: colors.red, marginTop: 2 }}>Deadline is required</div>
              ) : editDeadlineSoon ? (
                <div style={{ fontSize: 9, color: colors.orange, marginTop: 2 }}>Warning: less than 1 hour until deadline — workers may not have enough time</div>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => onSaveEdit()} disabled={!editCanSave || editSaving} aria-label="Save edited job" style={{ flex: 1, padding: 12, background: !editCanSave || editSaving ? '#555' : colors.gold, color: '#000', fontWeight: 700, border: 'none', borderRadius: radii.md, cursor: !editCanSave || editSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{editSaving ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spinner 0.6s linear infinite' }} />SAVING...</> : 'SAVE'}</button>
              <button onClick={onCancelEdit} aria-label="Cancel editing" style={{ flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.md }}>CANCEL</button>
            </div>
          </div>
        </EditModalWrapper>
      }
    </div>
  )
}

function EditModalWrapper({ onClose, children, ariaLabel = 'Edit posted job' }: { onClose: () => void; children: React.ReactNode; ariaLabel?: string }) {
  const trapRef = useFocusTrap(true)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const root = document.getElementById('root') || document.body
    const prev = root.getAttribute('aria-hidden')
    const prevOverflow = document.body.style.overflow
    root.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      if (prev === null) root.removeAttribute('aria-hidden')
      else root.setAttribute('aria-hidden', prev)
      document.body.style.overflow = prevOverflow
    }
  }, [])
  return (
    <div ref={trapRef} onClick={onClose} style={modalOverlay} role="dialog" aria-modal="true" aria-label={ariaLabel}>
      {children}
    </div>
  )
}

const sectionHeader: React.CSSProperties = {
  fontSize: fontSizes.sm,
  fontWeight: 700,
  opacity: 0.7,
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: `1px solid ${colors.borderLight}`,
}

function DynamicJobFields({ newJob, setNewJob }: {
  newJob: NewJobForm
  setNewJob: React.Dispatch<React.SetStateAction<NewJobForm>>
}) {
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [inputFileName, setInputFileName] = useState('')
  const [inputFileSize, setInputFileSize] = useState(0)
  const [inputFileHash, setInputFileHash] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  const [isDragOver, setIsDragOver] = useState(false)

  const config = JOB_TYPE_CONFIGS[newJob.type]

  const updateParam = (key: string, value: string) => {
    setNewJob(prev => ({ ...prev, parameters: { ...prev.parameters, [key]: value } }))
  }

  const handleInputFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 50 * 1024 * 1024) return
    setInputFileName(file.name)
    setInputFileSize(file.size)
    try {
      const buf = await file.arrayBuffer()
      const hash = keccak256(new Uint8Array(buf))
      setInputFileHash(hash)
      setNewJob(prev => ({ ...prev, inputData: `ipfs://${hash.slice(2, 10)}...${file.name}` }))
    } catch {
      setInputFileName('')
      setInputFileSize(0)
      setInputFileHash('')
    }
  }

  const clearInputFile = () => {
    setInputFileName('')
    setInputFileSize(0)
    setInputFileHash('')
    setInputMode('text')
    setNewJob(prev => ({ ...prev, inputData: '' }))
    if (inputFileRef.current) inputFileRef.current.value = ''
  }

  if (!config) return null

  const verifOptions = config.verificationOptions || [
    { value: 'hash-check', label: 'Hash Check' },
    { value: 'manual-review', label: 'Manual Review' },
  ]

  const fmtSize = (bytes: number) =>
    bytes < 1024 ? `${bytes}B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / 1024 / 1024).toFixed(2)}MB`

  return (
    <div style={{ marginTop: 12, marginBottom: 16, background: 'rgba(255,255,255,0.02)', border: `1px solid ${config.color}22`, borderRadius: radii.md, padding: 14 }}>
      <div style={{ fontSize: fontSizes.xs, fontWeight: 700, color: config.color, marginBottom: 12 }}>
        {config.label} Configuration
      </div>

      {/* Parameters */}
      <div style={sectionHeader}>Job Parameters</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {config.fields.map(field => (
              <div key={field.key}>
                <div style={{ fontSize: fontSizes.xs, opacity: 0.7, marginBottom: 3 }}>
                  {field.label}{field.required ? <span style={{ color: config.color }}>*</span> : ''}
                </div>
                {field.type === 'select' && field.options ? (
                  <SearchableSelect
                    value={newJob.parameters[field.key] || ''}
                    placeholder={field.placeholder || 'Type to search...'}
                    options={field.options}
                    onChange={v => updateParam(field.key, v)}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={newJob.parameters[field.key] || ''}
                    onChange={e => updateParam(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 8, color: colors.textPrimary, fontSize: fontSizes.sm, borderRadius: radii.sm, minHeight: 50, boxSizing: 'border-box', resize: 'none' }}
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={newJob.parameters[field.key] || ''}
                    onChange={e => updateParam(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 8, color: colors.textPrimary, fontSize: fontSizes.sm, borderRadius: radii.sm, boxSizing: 'border-box' }}
                  />
                )}
                {field.hint && <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>{field.hint}</div>}
              </div>
            ))}

          </div>

          {/* Input Data */}
          <div style={sectionHeader}>Input Data / Payload</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: fontSizes.xs, opacity: 0.5, marginBottom: 4 }}>{config.inputHint}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <button type="button" onClick={() => { setInputMode('text'); clearInputFile() }} style={{ padding: '3px 10px', borderRadius: radii.sm, border: `1px solid ${inputMode === 'text' ? config.color : colors.border}`, background: inputMode === 'text' ? `${config.color}18` : 'transparent', color: inputMode === 'text' ? config.color : colors.textMuted, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Paste URL / Text</button>
              <button type="button" onClick={() => setInputMode('file')} style={{ padding: '3px 10px', borderRadius: radii.sm, border: `1px solid ${inputMode === 'file' ? config.color : colors.border}`, background: inputMode === 'file' ? `${config.color}18` : 'transparent', color: inputMode === 'file' ? config.color : colors.textMuted, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Upload File</button>
            </div>
            {inputMode === 'file' ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); handleInputFile(e.dataTransfer.files?.[0]) }}
                onClick={() => inputFileRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? config.color : inputFileName ? colors.green : colors.border}`,
                  borderRadius: radii.md, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                  background: isDragOver ? `${config.color}0c` : inputFileName ? '#0a1f0a' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <input ref={inputFileRef} type="file" onChange={e => handleInputFile(e.target.files?.[0])} style={{ display: 'none' }} />
                {inputFileName ? (
                  <div>
                    <div style={{ fontSize: fontSizes.sm, color: colors.green, fontWeight: 600 }}>{inputFileName}</div>
                    <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{fmtSize(inputFileSize)} · {inputFileHash.slice(0, 14)}...</div>
                    <div onClick={e => { e.stopPropagation(); clearInputFile() }} style={{ marginTop: 6, fontSize: 10, color: colors.red, textDecoration: 'underline', cursor: 'pointer' }}>Remove file</div>
                  </div>
                ) : (
                  <div style={{ fontSize: fontSizes.xs, opacity: 0.6 }}>Drop file here or click to browse (max 50MB)</div>
                )}
                <div style={{ marginTop: 6, fontSize: 9, opacity: 0.4, textAlign: 'center' }}>File is hashed locally only — not uploaded. Host your file on IPFS/Arweave and paste CID in text mode instead.</div>
              </div>
            ) : (
              <textarea
                value={newJob.inputData}
                onChange={e => setNewJob(prev => ({ ...prev, inputData: e.target.value }))}
                placeholder={config.inputPlaceholder}
                style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 8, color: colors.textPrimary, fontSize: fontSizes.sm, borderRadius: radii.sm, minHeight: 50, boxSizing: 'border-box', resize: 'none' }}
              />
            )}
          </div>

          {/* Expected Output */}
          <div style={sectionHeader}>Expected Output</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: fontSizes.xs, opacity: 0.5, marginBottom: 4 }}>{config.outputHint}</div>
            <textarea
              value={newJob.expectedOutput}
              onChange={e => setNewJob(prev => ({ ...prev, expectedOutput: e.target.value }))}
              placeholder="Describe the expected output format and quality threshold..."
              style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 8, color: colors.textPrimary, fontSize: fontSizes.sm, borderRadius: radii.sm, minHeight: 50, boxSizing: 'border-box', resize: 'none' }}
            />
            {newJob.verificationMethod === 'zk-proof' && (
              <div style={{ marginTop: 8, fontSize: 11, background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', padding: '8px 10px', borderRadius: radii.sm, color: '#c4b5fd' }}>
                <strong>ZK mode:</strong> Paste the <strong>target Poseidon hash</strong> here (Poseidon(jobId, correctSolution)).
                Workers will later enter the matching private <code>solution</code> in the ZK submit form. Only a valid ZK proof of knowledge will auto-release payment.
              </div>
            )}
          </div>

          {/* Verification Method */}
          <div style={sectionHeader}>Verification Method</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {verifOptions.map(opt => (
              <label
                key={opt.value}
                style={{
                  flex: 1,
                  minWidth: 120,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: newJob.verificationMethod === opt.value ? `${config.color}22` : '#000',
                  border: `1px solid ${newJob.verificationMethod === opt.value ? config.color : colors.border}`,
                  borderRadius: radii.sm,
                  cursor: 'pointer',
                  fontSize: fontSizes.xs,
                  color: newJob.verificationMethod === opt.value ? config.color : colors.textPrimary,
                  fontWeight: newJob.verificationMethod === opt.value ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="verificationMethod"
                  value={opt.value}
                  checked={newJob.verificationMethod === opt.value}
                  onChange={e => setNewJob(prev => ({ ...prev, verificationMethod: e.target.value }))}
                  style={{ accentColor: config.color }}
                />
                {opt.label}
              </label>
            ))}
          </div>
    </div>
  )
}

function NewJobForm({ newJob, setNewJob, onPost, loading, isMobile }: {
  newJob: NewJobForm
  setNewJob: React.Dispatch<React.SetStateAction<NewJobForm>>
  onPost: () => void
  loading: boolean
  isMobile: boolean
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPreview, setShowPreview] = useState(false)

  const flexRow = (gap = 12) => ({ display: 'flex', gap, flexDirection: isMobile ? 'column' as const : 'row' as const })

  const reward = isNaN(newJob.reward) ? 0 : newJob.reward
  const workers = isNaN(newJob.maxWorkers) ? 0 : newJob.maxWorkers
  const total = reward * workers
  const totalFormatted = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const deadlineMs = newJob.deadline ? new Date(newJob.deadline).getTime() : NaN
  const deadlineInvalid = newJob.deadline ? isNaN(deadlineMs) : false
  const deadlinePast = !deadlineInvalid && !isNaN(deadlineMs) && deadlineMs <= Date.now()
  const deadlineSoon = !deadlineInvalid && !isNaN(deadlineMs) && deadlineMs > Date.now() && deadlineMs - Date.now() < 3600000
  const deadlineEmpty = !newJob.deadline?.trim()
  const titleEmpty = !newJob.title.trim()
  const rewardZero = isNaN(newJob.reward) || newJob.reward <= 0
  const workersInvalid = isNaN(newJob.maxWorkers) || newJob.maxWorkers < 1
  const canSubmit = !titleEmpty && !rewardZero && !workersInvalid && !deadlinePast && !deadlineInvalid && !deadlineEmpty

  const update = (partial: Partial<NewJobForm>) => setNewJob((prev: NewJobForm) => ({ ...prev, ...partial }))
  const tokenColor = TOKEN_COLORS[newJob.token] || colors.gold
  const tokenSymbol = TOKEN_SYMBOLS[newJob.token] || 'zkLTC'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <form onSubmit={e => { e.preventDefault(); setTouched({ title: true, reward: true, workers: true }); if (!canSubmit) return; setShowPreview(true) }} style={{ background: colors.bgCard, padding: 24, border: `1px solid ${colors.borderLight}`, borderRadius: radii.lg, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        {/* 1. Title */}
        {touched.title && titleEmpty && <div style={{ fontSize: 9, color: colors.red, marginBottom: 4 }}>Title is required</div>}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input placeholder="Job Title" maxLength={120} value={newJob.title} onChange={e => update({ title: e.target.value })} onBlur={() => setTouched(p => ({ ...p, title: true }))} aria-label="Job title" style={{ width: '100%', background: '#000', border: `1px solid ${touched.title && titleEmpty ? colors.red : colors.border}`, padding: 10, color: colors.textPrimary, fontSize: fontSizes.md, boxSizing: 'border-box', borderRadius: radii.sm, paddingRight: 40 }} />
          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, opacity: 0.35 }}>{newJob.title.length}/{120}</span>
        </div>

        {/* 2. Description */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <textarea placeholder="Job Description — explain what needs to be done, including context and expected approach" maxLength={2000} value={newJob.description} onChange={e => update({ description: e.target.value })} aria-label="Job description" style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: colors.textPrimary, fontSize: fontSizes.md, minHeight: 70, boxSizing: 'border-box', borderRadius: radii.sm, resize: 'none' }} />
          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, opacity: 0.35 }}>{newJob.description.length}/{2000}</span>
        </div>

        {/* 3. Job Type + Dynamic Config */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: fontSizes.sm, opacity: 0.6, marginBottom: 6 }}>Job Type</div>
          <SearchableTypeSelect
            value={newJob.type}
            onChange={newType => {
              const cfg = JOB_TYPE_CONFIGS[newType]
              update({
                type: newType,
                parameters: {},
                verificationMethod: cfg?.verificationOptions?.[0]?.value || 'hash-check',
              })
            }}
          />
        </div>
        <DynamicJobFields key={newJob.type} newJob={newJob} setNewJob={setNewJob} />

        {/* 4. Requirements */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <textarea placeholder="Hardware / Environment Requirements — e.g. CPU cores, RAM, GPU model, OS, software dependencies" maxLength={1000} value={newJob.requirements} onChange={e => update({ requirements: e.target.value })} aria-label="Job requirements" style={{ width: '100%', background: '#000', border: `1px solid ${colors.border}`, padding: 10, color: colors.textPrimary, fontSize: fontSizes.md, minHeight: 60, boxSizing: 'border-box', borderRadius: radii.sm, resize: 'none' }} />
          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, opacity: 0.35 }}>{newJob.requirements.length}/{1000}</span>
        </div>

        {/* 5. Reward + Token */}
        <div style={{ ...flexRow(), marginBottom: 10 }}>
          <div style={{ flex: isMobile ? '1 1 100%' : 1 }}>
            <div style={{ fontSize: fontSizes.sm, opacity: 0.6, marginBottom: 4 }}>Reward Amount</div>
            {touched.reward && rewardZero && <div style={{ fontSize: 9, color: colors.red, marginBottom: 4 }}>Reward must be greater than 0</div>}
            <input type="number" step="0.01" min="0.01" required placeholder="e.g. 0.5" value={Number.isNaN(newJob.reward) ? '' : newJob.reward} onChange={e => { const v = e.target.value; update({ reward: v === '' ? 0 : parseFloat(v) }) }} onBlur={() => setTouched(p => ({ ...p, reward: true }))} aria-label="Reward amount" style={{ width: '100%', background: '#000', border: `1px solid ${touched.reward && rewardZero ? colors.red : colors.border}`, padding: 10, color: colors.textPrimary, fontSize: fontSizes.base, boxSizing: 'border-box', borderRadius: radii.sm }} />
          </div>
          <div style={{ flex: isMobile ? '1 1 100%' : 1 }}>
            <div style={{ fontSize: fontSizes.sm, opacity: 0.6, marginBottom: 4 }}>Token</div>
            <select
              value={newJob.token}
              onChange={e => update({ token: e.target.value as 'zkLTC' | 'USDC' | 'custom' })}
              aria-label="Payment token"
              style={{ width: '100%', background: '#000', border: `2px solid ${tokenColor}`, padding: 9, color: tokenColor, fontSize: fontSizes.base, fontWeight: 700, borderRadius: radii.sm, cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="zkLTC" style={{ color: colors.gold, background: '#000' }}>zkLTC</option>
              <option value="USDC" style={{ color: colors.blue, background: '#000' }}>USDC</option>
              <option value="custom" disabled style={{ color: '#a855f7', background: '#000' }}>Custom — (Soon)</option>
            </select>
            {newJob.token === 'custom' && (
              <input
                placeholder="0x..."
                value={newJob.customToken || ''}
                onChange={e => update({ customToken: e.target.value })}
                style={{ width: '100%', background: '#000', border: '2px solid #a855f7', padding: 9, color: '#a855f7', fontSize: fontSizes.xs, borderRadius: radii.sm, marginTop: 4, boxSizing: 'border-box' }}
              />
            )}
          </div>
        </div>

        {/* 6. Workers + Deadline */}
        <div style={{ ...flexRow(), marginBottom: 14 }}>
          <div style={{ flex: isMobile ? '1 1 100%' : 1 }}>
            <div style={{ fontSize: fontSizes.sm, opacity: 0.6, marginBottom: 4 }}>Number of Workers</div>
            {touched.workers && workersInvalid && <div style={{ fontSize: 9, color: colors.red, marginBottom: 4 }}>At least 1 worker required</div>}
            <input type="number" min={1} max={100} required placeholder="e.g. 3" value={Number.isNaN(newJob.maxWorkers) ? '' : newJob.maxWorkers} onChange={e => { const v = e.target.value.replace(/^0+/, ''); update({ maxWorkers: v === '' ? 1 : parseInt(v) || 1 }) }} onBlur={() => setTouched(p => ({ ...p, workers: true }))} aria-label="Number of workers" style={{ width: '100%', background: '#000', border: `1px solid ${touched.workers && workersInvalid ? colors.red : colors.border}`, padding: 10, color: colors.textPrimary, fontSize: fontSizes.base, boxSizing: 'border-box', borderRadius: radii.sm }} />
          </div>
          <div style={{ flex: isMobile ? '1 1 100%' : 1 }}>
            <div style={{ fontSize: fontSizes.sm, opacity: 0.6, marginBottom: 4 }}>Deadline</div>
            <input
              type="datetime-local"
              value={newJob.deadline ? newJob.deadline.slice(0, 16) : ''}
              onChange={e => update({ deadline: e.target.value })}
              style={{ width: '100%', background: '#000', border: `1px solid ${deadlinePast ? colors.red : deadlineInvalid ? colors.orange : colors.border}`, padding: 10, color: colors.textPrimary, fontSize: fontSizes.base, boxSizing: 'border-box', colorScheme: 'dark' }}
            />
            {deadlinePast ? (
              <div style={{ fontSize: 9, color: colors.red, marginTop: 2 }}>Deadline must be in the future</div>
            ) : deadlineInvalid ? (
              <div style={{ fontSize: 9, color: colors.orange, marginTop: 2 }}>Invalid date format</div>
            ) : deadlineEmpty ? (
              <div style={{ fontSize: 9, color: colors.red, marginTop: 2 }}>Deadline is required</div>
            ) : deadlineSoon ? (
              <div style={{ fontSize: 9, color: colors.orange, marginTop: 2 }}>Warning: less than 1 hour until deadline — workers may not have enough time</div>
            ) : (
              <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>Pick a date & time — must be in the future</div>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading || !canSubmit} aria-label="Post new job" style={{ width: '100%', background: loading || !canSubmit ? '#555' : tokenColor, color: '#000', border: 'none', padding: 12, fontSize: fontSizes.md, fontWeight: 700, borderRadius: radii.md, cursor: loading || !canSubmit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spinner 0.6s linear infinite' }} />POSTING ON-CHAIN...</> : `POST JOB (${totalFormatted} ${tokenSymbol} total)`}
        </button>
        {!titleEmpty && reward > 0 && workers >= 1 && (
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: fontSizes.sm, opacity: 0.5 }}>
            Escrow: {reward} {tokenSymbol} × {workers} worker = {totalFormatted} {tokenSymbol} held in contract
          </div>
        )}
      </form>

      {showPreview && (
        <EditModalWrapper onClose={() => setShowPreview(false)} ariaLabel="Confirm job post">
          <div onClick={e => e.stopPropagation()} style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            padding: 28,
            borderRadius: radii.xl,
            maxWidth: 520,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: fontSizes.lg }}>Confirm Job Post</h3>

            <div style={{ ...sectionHeader, marginBottom: 8 }}>Details</div>
            <PreviewRow label="Title" value={newJob.title} />
            <PreviewRow label="Type" value={JOB_TYPE_CONFIGS[newJob.type]?.label || newJob.type} />
            <PreviewRow label="Description" value={newJob.description} multiline />

            {Object.keys(newJob.parameters).length > 0 && (
              <>
                <div style={{ ...sectionHeader, marginTop: 12, marginBottom: 8 }}>Parameters</div>
                {Object.entries(newJob.parameters).map(([k, v]) => (
                  <PreviewRow key={k} label={k} value={v} />
                ))}
              </>
            )}

            {newJob.inputData && <PreviewRow label="Input Data" value={newJob.inputData} multiline />}
            {newJob.expectedOutput && <PreviewRow label="Expected Output" value={newJob.expectedOutput} multiline />}
            <PreviewRow label="Verification" value={newJob.verificationMethod} />

            <div style={{ ...sectionHeader, marginTop: 12, marginBottom: 8 }}>Settings</div>
            <PreviewRow label="Requirements" value={newJob.requirements} multiline />
            <PreviewRow label="Reward" value={`${reward} ${tokenSymbol}`} />
            <PreviewRow label="Workers" value={String(newJob.maxWorkers)} />
            <PreviewRow label="Deadline" value={newJob.deadline ? new Date(newJob.deadline).toLocaleString() : '-'} />

            <div style={{ textAlign: 'center', marginTop: 16, padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: radii.sm, fontSize: fontSizes.sm, opacity: 0.7 }}>
              Escrow: {reward} {tokenSymbol} × {workers} worker = {totalFormatted} {tokenSymbol} held in contract
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => { setShowPreview(false); onPost() }} disabled={loading} aria-label="Confirm and post job" style={{
                flex: 1, padding: 12, background: loading ? '#555' : tokenColor, color: '#000', fontWeight: 700, border: 'none', borderRadius: radii.md, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'POSTING...' : 'CONFIRM & POST'}
              </button>
              <button onClick={() => setShowPreview(false)} disabled={loading} aria-label="Cancel posting" style={{
                flex: 1, padding: 12, border: '1px solid #555', background: 'transparent', color: '#c0c0c0', borderRadius: radii.md, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                CANCEL
              </button>
            </div>
          </div>
        </EditModalWrapper>
      )}
    </div>
  )
}

function PreviewRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: fontSizes.xs, color: colors.textPrimary, wordBreak: 'break-word', ...(multiline ? { maxHeight: 60, overflow: 'auto' } : {}) }}>
        {value || <span style={{ opacity: 0.3 }}>—</span>}
      </div>
    </div>
  )
}

function SearchableTypeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items = Object.entries(JOB_TYPE_CONFIGS).map(([key, cfg]) => ({ value: key, label: cfg.label }))
  const selected = JOB_TYPE_CONFIGS[value]
  return (
    <div style={{ position: 'relative' }}>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={items}
        placeholder="Type to search job type..."
      />
      {selected && (
        <div style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          width: 8, height: 8, borderRadius: '50%', background: selected.color,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}