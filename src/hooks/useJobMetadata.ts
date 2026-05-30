const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const TABLE = 'job_metadata'
const API = `${SUPABASE_URL}/rest/v1/${TABLE}`
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

export interface JobMetadata {
  job_id: number
  poster: string
  title?: string
  type?: string
  description: string
  requirements: string
  deadline: string
  token_symbol: string
  difficulty?: string
}

export async function saveJobMetadata(meta: JobMetadata) {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(meta),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('saveJobMetadata failed:', res.status, text)
    }
  } catch (e) {
    console.error('saveJobMetadata threw:', e)
  }
}

export async function fetchJobMetadata(jobIds: number[]): Promise<Map<number, JobMetadata>> {
  if (jobIds.length === 0) return new Map()
  const ids = jobIds.join(',')
  try {
    const res = await fetch(`${API}?job_id=in.(${ids})&select=*`, { headers: HEADERS })
    if (!res.ok) return new Map()
    const rows = await res.json() as JobMetadata[]
    const map = new Map<number, JobMetadata>()
    for (const row of rows) map.set(row.job_id, row)
    return map
  } catch (e) {
    console.error('Failed to fetch job metadata:', e)
    return new Map()
  }
}
