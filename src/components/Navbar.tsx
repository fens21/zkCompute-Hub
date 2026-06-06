import { useRef, useEffect, useState } from 'react'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import type { Tab, Notification } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import { colors, radii, fontSizes } from '../styles/tokens'

export function Navbar({ tab, setTab, entered, onSwitchNetwork, isWrongNetwork, notifications, setNotifications, showNotifications, setShowNotifications }: {
  tab: Tab
  setTab: (t: Tab) => void
  entered: boolean
  onSwitchNetwork: () => void
  isWrongNetwork: boolean
  notifications: Notification[]
  setNotifications: (v: Notification[]) => void
  showNotifications: boolean
  setShowNotifications: (v: boolean) => void
}) {
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const walletMenuRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const isMobile = useIsMobile()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address, chainId: 4441 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
    }
    if (showNotifications) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifications, setShowNotifications])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(e.target as Node)) setShowWalletMenu(false)
    }
    if (showWalletMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showWalletMenu])

  useEffect(() => { setMobileMenuOpen(false) }, [tab])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileMenuOpen])

  const unreadCount = notifications.filter(n => !n.read).length
  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })))
  const markRead = (id: number) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  const clearAll = () => setNotifications([])

  function timeAgo(ts: number) {
    const diff = Date.now() - ts
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'market', label: 'Marketplace' },
    { key: 'post', label: 'Post Job' },
    { key: 'my', label: 'My Jobs' },
    { key: 'stats', label: 'Stats' },
    { key: 'leaderboard', label: 'Top Worker' },
  ]

  return (
    <>
      <nav style={{
        background: 'radial-gradient(ellipse at 30% 50%, #1a0033 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #001a11 0%, transparent 60%), #000000',
        borderBottom: '1px solid #222',
        padding: isMobile ? '10px 16px' : '12px 24px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 100,
      }}>

        {/* Logo */}
        <div onClick={() => setTab('market')} role="button" aria-label="Go to marketplace" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer', padding: isMobile ? '4px 0' : 0 }}>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.gold, letterSpacing: -0.5 }}>zkCompute Hub</div>
              <div style={{ fontSize: 8, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                LITVM &bull; LITECOIN ROLLUP
                {entered && (
                  <span style={{ background: isWrongNetwork ? colors.red : '#1a3c1a', color: isWrongNetwork ? '#000' : colors.green, padding: '1px 6px', borderRadius: radii.lg, fontSize: 8, fontWeight: 600 }}>
                    {isWrongNetwork ? 'WRONG NETWORK' : 'LITFORGE'}
                  </span>
                )}
              </div>
            </div>
          )}
          {isMobile && (
            <div style={{ fontSize: fontSizes.lg, fontWeight: 700, color: colors.gold }}>zkCompute Hub</div>
          )}
        </div>

        {/* Desktop tabs */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, justifyContent: 'center', padding: '0 16px', minWidth: 0 }}>
            {tabs.map(t => (
              <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} label={t.label} />
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, marginLeft: 'auto', flexShrink: 0 }}>

          {/* Notifications */}
          {entered && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                style={{ background: '#151515', border: `1px solid ${colors.borderLight}`, padding: '7px 10px', borderRadius: radii.md, cursor: 'pointer', position: 'relative', fontSize: 16, lineHeight: 1 }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -6, background: colors.red, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div role="dialog" aria-label="Notifications" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.lg, width: isMobile ? '90vw' : 320, maxWidth: 360, maxHeight: 360, overflow: 'auto', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #222', position: 'sticky', top: 0, background: colors.bgCard }}>
                    <span style={{ fontSize: fontSizes.base, fontWeight: 600, color: '#e0e0e0' }}>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {notifications.length > 0 && <button onClick={clearAll} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: fontSizes.xs, cursor: 'pointer', fontWeight: 600 }}>Clear all</button>}
                      {unreadCount > 0 && <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', color: colors.gold, fontSize: fontSizes.xs, cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>}
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 14px', textAlign: 'center', fontSize: fontSizes.base, opacity: 0.4 }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => { markRead(n.id); setShowNotifications(false) }} role="button" tabIndex={0} aria-label={n.type} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #1a1a1a', opacity: n.read ? 0.45 : 1, background: n.read ? 'transparent' : '#0d0d0d', cursor: 'pointer' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: fontSizes.sm, color: '#c0c0c0', lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: 9, opacity: 0.35, marginTop: 3 }}>{timeAgo(n.time)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wallet — RainbowKit ConnectButton.Custom */}
          <ConnectButton.Custom>
            {({ openConnectModal, authenticationStatus, mounted }) => {
              const ready = mounted && authenticationStatus !== 'loading'
              const connected = ready && address
              return (
                <div
                  {...(!ready ? { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } } : {})}
                >
                  {!connected ? (
                    <button onClick={openConnectModal} disabled={!ready} aria-label="Connect wallet" style={{ background: colors.gold, color: '#000', border: 'none', padding: isMobile ? '6px 10px' : '8px 14px', fontWeight: 700, borderRadius: radii.md, cursor: 'pointer', fontSize: isMobile ? fontSizes.sm : fontSizes.base }}>
                      {isMobile ? 'Connect' : 'Connect Wallet'}
                    </button>
                  ) : (
                    <>
                      <div ref={walletMenuRef} style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowWalletMenu(!showWalletMenu)}
                          aria-label="Wallet menu"
                          aria-expanded={showWalletMenu}
                          title={`${address.slice(0, 6)}...${address.slice(-4)}`}
                          style={{ background: '#151515', color: colors.textPrimary, border: `1px solid ${colors.borderLight}`, padding: '8px 20px', borderRadius: radii.md, cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontFamily: "'Space Mono', monospace" }}>
                          {address.slice(0, 6)}...{address.slice(-4)}
                        </button>
                        {showWalletMenu && (
                          <div role="menu" aria-label="Wallet menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: colors.bgCard, border: `1px solid ${colors.borderLight}`, borderRadius: radii.md, zIndex: 100, overflow: 'hidden', minWidth: 'max-content' }}>
                            <button onClick={() => { setTab('profile'); setShowWalletMenu(false) }} role="menuitem" aria-label="View profile" style={{ width: '100%', background: 'transparent', color: '#e0e0e0', border: 'none', padding: '8px 20px', textAlign: 'left', cursor: 'pointer', fontSize: fontSizes.base, fontFamily: "'Space Mono', monospace" }}>
                              Profile
                            </button>
                            <a
                              href={`https://liteforge.explorer.caldera.xyz/address/${address}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', padding: '8px 20px', borderTop: '1px solid #222', borderBottom: '1px solid #222', color: colors.gold, fontSize: fontSizes.base, fontFamily: "'Space Mono', monospace", textAlign: 'left', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                              {balance && Number(balance.value) > 0 ? `${(Number(balance.value) / 1e18).toFixed(4)} ${balance.symbol}` : '— zkLTC'}
                            </a>
                            {isWrongNetwork && (
                              <button onClick={() => { onSwitchNetwork(); setShowWalletMenu(false) }} role="menuitem" aria-label="Switch network" style={{ width: '100%', background: 'transparent', color: colors.red, border: 'none', padding: '8px 20px', textAlign: 'left', cursor: 'pointer', fontSize: fontSizes.base }}>
                                Switch Network
                              </button>
                            )}
                            <button onClick={() => { disconnect(); setShowWalletMenu(false) }} role="menuitem" aria-label="Disconnect wallet" style={{ width: '100%', background: 'transparent', color: colors.red, border: 'none', padding: '8px 20px', textAlign: 'left', cursor: 'pointer', fontSize: fontSizes.base, fontFamily: "'Space Mono', monospace" }}>
                              Disconnect
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            }}
          </ConnectButton.Custom>

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{ background: '#151515', border: `1px solid ${colors.borderLight}`, padding: '8px 10px', borderRadius: radii.md, cursor: 'pointer', fontSize: 16, lineHeight: 1, color: colors.textPrimary }}>
              {mobileMenuOpen ? 'X' : '='}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {isMobile && (
        <div ref={menuRef} style={{
          background: '#0a0a0a', borderBottom: '1px solid #222', padding: mobileMenuOpen ? '8px 16px 16px' : '0 16px',
          zIndex: 90, overflow: 'hidden',
          maxHeight: mobileMenuOpen ? 500 : 0,
          transition: 'max-height 0.25s ease, padding 0.25s ease',
        }}>
          {entered && (
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: isWrongNetwork ? colors.red : '#1a3c1a', color: isWrongNetwork ? '#000' : colors.green, padding: '3px 10px', borderRadius: radii.lg, fontSize: fontSizes.xs, fontWeight: 600 }}>
                {isWrongNetwork ? 'WRONG NETWORK' : 'LITFORGE TESTNET'}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: tab === t.key ? colors.bgElevated : 'transparent',
                  border: tab === t.key ? '1px solid #444' : '1px solid transparent',
                  padding: '12px 16px',
                  color: tab === t.key ? '#e0e0e0' : '#888',
                  cursor: 'pointer',
                  fontSize: fontSizes.lg,
                  borderRadius: radii.md,
                  fontWeight: 600,
                  textAlign: 'left',
                }}>
                <span>{t.label}</span>
                {tab === t.key && <span style={{ marginLeft: 'auto', color: colors.gold, fontSize: fontSizes.base }}>●</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Wrong network banner */}
      {isWrongNetwork && (
        <div style={{ background: colors.red, color: '#000', padding: isMobile ? '10px 14px' : '10px 24px', textAlign: 'center', fontWeight: 600, fontSize: isMobile ? 11 : 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>Wrong network — switch to LitForge Testnet (Chain ID 4441)</span>
          <button onClick={onSwitchNetwork} style={{ background: '#000', color: colors.textPrimary, border: 'none', padding: '8px 16px', borderRadius: radii.sm, fontWeight: 700, cursor: 'pointer', fontSize: fontSizes.base, minHeight: isMobile ? 44 : 36 }}>
            SWITCH NETWORK
          </button>
        </div>
      )}
    </>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={`${label} tab`} aria-current={active ? 'page' : undefined} style={{
      background: active ? colors.bgElevated : 'transparent',
      border: active ? '1px solid #444' : '1px solid transparent',
      padding: '7px 14px',
      color: active ? '#e0e0e0' : '#888',
      cursor: 'pointer',
      fontSize: fontSizes.base,
      borderRadius: radii.md,
      fontWeight: 600,
      minWidth: 90,
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}