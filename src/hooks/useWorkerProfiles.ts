import { useCallback } from 'react'
import type { WorkerProfile } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const PROFILES_KEY = 'zkcompute_profiles_cache'

// ── Local cache helpers ──────────────────────────────────────────────────
function loadLocalCache(): Record<string, WorkerProfile> {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}') } catch { return {} }
}
function saveLocalCache(profiles: Record<string, WorkerProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

// ── Supabase REST helpers ────────────────────────────────────────────────
async function fetchProfileFromSupabase(worker: string): Promise<WorkerProfile | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?worker=eq.${worker.toLowerCase()}&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return {
        worker: data[0].worker,
        bio: data[0].bio,
        skills: data[0].skills,
        avatarUrl: data[0].avatar_url || '',
        updatedAt: data[0].updated_at,
      }
    }
    return null
  } catch { return null }
}

async function upsertProfileToSupabase(worker: string, bio: string, skills: string[], avatarUrl?: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        worker: worker.toLowerCase(),
        bio,
        skills,
        avatar_url: avatarUrl ?? '',
        updated_at: Date.now(),
      }),
    })
  } catch (e) {
    console.error('Failed to save profile to Supabase:', e)
  }
}

async function fetchAllProfilesFromSupabase(): Promise<Record<string, WorkerProfile>> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await res.json()
    if (!Array.isArray(data)) return {}
    const map: Record<string, WorkerProfile> = {}
    for (const row of data) {
      map[row.worker] = {
        worker: row.worker,
        bio: row.bio,
        skills: row.skills,
        avatarUrl: row.avatar_url || '',
        updatedAt: row.updated_at,
      }
    }
    return map
  } catch { return {} }
}

// ── Avatar upload ────────────────────────────────────────────────────────
export async function uploadAvatar(worker: string, file: File): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop()
    const filename = `${worker.toLowerCase()}.${ext}`

    // Upload to Supabase Storage
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/avatars/${filename}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': file.type,
          'x-upsert': 'true', // overwrite if already exists
        },
        body: file,
      }
    )
    if (!res.ok) {
      console.error('Upload failed:', await res.text())
      return null
    }
    // Return public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${filename}`
    return publicUrl
  } catch (e) {
    console.error('Avatar upload error:', e)
    return null
  }
}

// ── Public API ───────────────────────────────────────────────────────────
export function loadProfiles(): Record<string, WorkerProfile> {
  return loadLocalCache()
}

export async function loadProfilesRemote(): Promise<Record<string, WorkerProfile>> {
  const remote = await fetchAllProfilesFromSupabase()
  if (Object.keys(remote).length > 0) saveLocalCache(remote)
  return Object.keys(remote).length > 0 ? remote : loadLocalCache()
}

export async function saveProfile(worker: string, bio: string, skills: string[], avatarUrl?: string) {
  const cache = loadLocalCache()
  const existing = cache[worker.toLowerCase()]
  const finalAvatar = avatarUrl ?? existing?.avatarUrl ?? ''
  cache[worker.toLowerCase()] = {
    worker: worker.toLowerCase(),
    bio,
    skills,
    avatarUrl: finalAvatar,
    updatedAt: Date.now(),
  }
  saveLocalCache(cache)
  await upsertProfileToSupabase(worker, bio, skills, finalAvatar)
}

export async function getProfile(worker: string): Promise<WorkerProfile | null> {
  const cache = loadLocalCache()
  const local = cache[worker.toLowerCase()]
  if (local) return local
  const remote = await fetchProfileFromSupabase(worker)
  if (remote) {
    cache[worker.toLowerCase()] = remote
    saveLocalCache(cache)
  }
  return remote
}

export function useWorkerProfiles() {
  const loadAll = useCallback(() => loadProfiles(), [])
  return { loadAll, getProfile, saveProfile }
}
