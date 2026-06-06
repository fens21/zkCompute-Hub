import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement as HTMLElement

    const el = ref.current
    if (!el) return

    const focusables = () => el.querySelectorAll<HTMLElement>(FOCUSABLE)

    const first = () => {
      const f = focusables()
      if (f.length > 0) f[0].focus()
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const f = focusables()
      if (f.length === 0) return
      const current = document.activeElement
      if (e.shiftKey) {
        if (current === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
      } else {
        if (current === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }

    first()
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      prevFocus.current?.focus()
    }
  }, [open])

  return ref
}
