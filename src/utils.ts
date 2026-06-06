export function shorten(addr: string) {
  return addr.length > 10 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr
}

export function handleTxError(error: unknown, action: string, showToast: (message: string, type?: 'success' | 'info' | 'error') => void) {
  const err = error as { shortMessage?: string; message?: string; cause?: { shortMessage?: string } }
  const causeMsg = err?.cause?.shortMessage
  const msg = causeMsg || err?.shortMessage || err?.message || 'Transaction rejected'
  console.error(`${action} failed:`, error)
  showToast(`${action} failed: ${msg}`, 'error')
}

export function getDeadlineMs(createdAt: number | undefined, deadline: string): number | null {
  // New format: ISO date string or timestamp string
  const ts = Date.parse(deadline)
  if (!isNaN(ts)) return ts
  // Old format: "4h" (relative hours) — requires createdAt
  if (deadline.includes('h') && createdAt) {
    const hours = parseInt(deadline)
    if (!isNaN(hours) && hours > 0) return createdAt + hours * 3600000
  }
  return null
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired'
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return '<1m'
}

export function formatDeadlineDate(createdAt: number | undefined, deadline: string): string {
  const endMs = getDeadlineMs(createdAt, deadline)
  if (endMs === null) return 'N/A'
  const d = new Date(endMs)
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = d.getFullYear()
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${month} ${day}, ${year} ${hour}:${min}`
}

export const COUNTDOWN_REFRESH = 60_000 // less frequent per-card updates for lighter feel

export function formatUsd(usd: number | null): string {
  if (usd === null) return '\u2014'
  if (usd < 1) return '$' + usd.toFixed(2)
  if (usd < 1000) return '$' + usd.toFixed(0)
  if (usd < 1_000_000) return '$' + (usd / 1000).toFixed(1) + 'k'
  if (usd < 1_000_000_000) return '$' + (usd / 1_000_000).toFixed(1) + 'M'
  return '$' + (usd / 1_000_000_000).toFixed(2) + 'B'
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function generateIdenticon(address: string): string {
  const clean = address.toLowerCase().replace('0x', '')
  const colors = ['#ffd700', '#4ade80', '#f97316', '#a78bfa', '#38bdf8', '#fb7185', '#34d399']
  const bg = colors[parseInt(clean.slice(0, 2), 16) % colors.length]
  const cells: boolean[] = []
  for (let i = 0; i < 15; i++) {
    cells.push(parseInt(clean[i % clean.length], 16) > 7)
  }
  const mirrored = Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5)
    const col = i % 5
    const srcCol = col > 2 ? 4 - col : col
    return cells[row * 3 + srcCol]
  })
  const rects = mirrored.map((on, i) => {
    if (!on) return ''
    const x = (i % 5) * 10
    const y = Math.floor(i / 5) * 10
    return `<rect x="${x}" y="${y}" width="10" height="10" fill="${bg}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect width="50" height="50" fill="#111"/>${rects}</svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
