import { useState, useEffect, useRef } from 'react'
import { colors, fontSizes, radii } from '../styles/tokens'

interface SearchableSelectProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  accentColor?: string
  background?: string
}

export function SearchableSelect({ value, onChange, options, placeholder, accentColor, background }: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIdx, setHighlightIdx] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query
    ? options.filter(opt =>
        opt.value.toLowerCase().includes(query.toLowerCase()) ||
        opt.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const selected = options.find(o => o.value === value)
  const selectedLabel = selected?.label || value
  const accent = accentColor || colors.gold

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (v: string) => {
    onChange(v)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setHighlightIdx(i => Math.max(i - 1, 0))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (filtered[highlightIdx]) {
        select(filtered[highlightIdx].value)
      }
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        value={open ? query : selectedLabel}
        placeholder={placeholder || 'Type to search...'}
        onFocus={() => { setOpen(true); setQuery(''); setHighlightIdx(0) }}
        onChange={e => { setQuery(e.target.value); setHighlightIdx(0); setOpen(true) }}
        onKeyDown={onKeyDown}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: background || '#000',
          border: value ? `1px solid ${accent}66` : `1px solid ${colors.border}`,
          padding: 10, color: colors.textPrimary,
          fontSize: fontSizes.md, borderRadius: radii.sm, outline: 'none',
        }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: background || '#000', border: `1px solid ${colors.border}`,
          borderRadius: radii.sm, maxHeight: 240, overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {query && filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: fontSizes.xs, opacity: 0.4 }}>No match found</div>
          ) : filtered.map((opt, idx) => (
            <div
              key={opt.value}
              onClick={() => select(opt.value)}
              onMouseEnter={() => setHighlightIdx(idx)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                background: idx === highlightIdx ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: idx === highlightIdx ? '#fff' : colors.textPrimary,
                fontWeight: idx === highlightIdx ? 700 : 400,
                fontSize: fontSizes.sm,
                borderLeft: `3px solid ${opt.value === value ? accent : 'transparent'}`,
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
