import type { Toast } from '../types'

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 300 }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{ background: toast.type === 'success' ? '#1a3c1a' : '#1a2a3c', border: '1px solid #444', padding: '14px 20px', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
