export function shorten(addr: string) {
  return addr.length > 10 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr
}

export function handleTxError(error: unknown, action: string, showToast: (message: string, type?: 'success' | 'info') => void) {
  const err = error as { shortMessage?: string; message?: string }
  const msg = err?.shortMessage || err?.message || 'Transaction rejected'
  console.error(`${action} failed:`, error)
  showToast(`Failed: ${msg}`, 'info')
}
