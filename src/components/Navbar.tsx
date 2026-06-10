import { useRef, useEffect, useState, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import type { Tab, Notification } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import { colors, radii, fontSizes } from '../styles/tokens'
import { chatStore } from '../store/chatStore'

function NavbarImpl({ tab, setTab, entered, onSwitchNetwork, isWrongNetwork, notifications, setNotifications, showNotifications, setShowNotifications }: {
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
  const navRef = useRef<HTMLDivElement>(null)
  const [navHeight, setNavHeight] = useState(57)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (navRef.current) setNavHeight(navRef.current.offsetHeight)
  }, [isMobile])
  const navigate = useNavigate()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    return chatStore.subscribe(() => setChatUnread(chatStore.getTotal()));
  }, [])
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
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'stats', label: 'Stats' },
    { key: 'leaderboard', label: 'Top Worker' },
  ]

  return (
    <>
      <nav ref={navRef} style={{
        background: '#1A2930',
        borderBottom: `1px solid rgba(247, 206, 62, 0.15)`,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
        padding: isMobile ? '10px 16px' : '12px 24px',
        display: 'flex',
        alignItems: 'center',
        position: isMobile ? 'fixed' : 'relative',
        top: 0, left: 0, right: 0,
        zIndex: 200,
      }}>

        {/* Logo */}
        <div onClick={() => setTab('market')} role="button" aria-label="Go to marketplace" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: isMobile ? 1 : '0 0 auto', justifyContent: isMobile ? 'center' : 'flex-start', cursor: 'pointer', padding: isMobile ? '4px 0' : 0 }}>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: colors.gold, letterSpacing: -0.5 }}>zkCompute Hub</div>
              <div style={{ fontSize: 8, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                LITVM &bull; LITECOIN ROLLUP
                {entered && (
                  <span style={{ background: isWrongNetwork ? colors.red : 'rgba(16,185,129,0.15)', color: isWrongNetwork ? '#fff' : colors.green, padding: '1px 6px', borderRadius: radii.lg, fontSize: 9, fontWeight: 600 }}>
                    {isWrongNetwork ? 'WRONG NETWORK' : 'LITFORGE'}
                  </span>
                )}
              </div>
            </div>
          )}
          {isMobile && (
            <div style={{ fontSize: fontSizes.lg, fontWeight: 700, color: colors.gold, whiteSpace: 'nowrap' }}>zkCompute Hub</div>
          )}
        </div>

        {/* Desktop tabs */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, justifyContent: 'center', padding: '0 16px', minWidth: 0, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} label={t.label} />
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, marginLeft: 'auto', flexShrink: 0 }}>

          {/* Notifications */}
          {entered && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                style={{ background: colors.bgCard, border: `2px solid rgba(197,193,192,0.06)`, padding: isMobile ? '6px 8px' : '7px 10px', borderRadius: radii.md, cursor: 'pointer', position: 'relative', fontSize: isMobile ? 14 : 16, lineHeight: 1, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = `${colors.gold}33` }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.bgCard; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.06)' }}
                onFocus={e => { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = `${colors.gold}33` }}
                onBlur={e => { e.currentTarget.style.background = colors.bgCard; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.06)' }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -6, background: colors.red, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18, padding: '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                  <div role="dialog" aria-label="Notifications" style={{ position: 'absolute', right: isMobile ? -60 : 0, top: '100%', marginTop: 6, background: colors.bgElevated, border: '1px solid rgba(197,193,192,0.06)', borderRadius: radii.lg, width: isMobile ? 'calc(100vw - 32px)' : 320, maxWidth: isMobile ? 'calc(100vw - 32px)' : 360, maxHeight: 360, overflow: 'auto', zIndex: 200, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(197,193,192,0.06)', position: 'sticky', top: 0, background: colors.bgElevated }}>
                    <span style={{ fontSize: fontSizes.base, fontWeight: 600, color: colors.textPrimary }}>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {notifications.length > 0 && <button onClick={clearAll} style={{ background: 'transparent', border: '1px solid rgba(197,193,192,0.1)', color: colors.textDim, fontSize: fontSizes.xs, cursor: 'pointer', fontWeight: 600, padding: '3px 8px', borderRadius: radii.sm }}>Clear all</button>}
                      {unreadCount > 0 && <button onClick={markAllRead} style={{ background: 'transparent', border: '1px solid rgba(247,206,62,0.2)', color: colors.gold, fontSize: fontSizes.xs, cursor: 'pointer', fontWeight: 600, padding: '3px 8px', borderRadius: radii.sm }}>Mark all read</button>}
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 14px', textAlign: 'center', fontSize: fontSizes.base, color: colors.textDim }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => { markRead(n.id); setShowNotifications(false) }} role="button" tabIndex={0} aria-label={n.type} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(197,193,192,0.04)', opacity: n.read ? 0.55 : 1, background: n.read ? 'transparent' : 'rgba(247,206,62,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,206,62,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(247,206,62,0.03)'}
                        onFocus={e => e.currentTarget.style.background = 'rgba(247,206,62,0.08)'}
                        onBlur={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(247,206,62,0.03)'}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: fontSizes.sm, color: colors.textPrimary, lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: colors.textDim, marginTop: 3 }}>{timeAgo(n.time)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          {entered && (
            <button
              onClick={() => navigate('/chat')}
              aria-label="Open chat"
              style={{ background: '#1e2d36', border: '1px solid rgba(247,206,62,0.15)', padding: isMobile ? '6px 8px' : '8px 11px', borderRadius: radii.md, cursor: 'pointer', position: 'relative', fontSize: isMobile ? 14 : 16, lineHeight: 1, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#23333d'; e.currentTarget.style.borderColor = `${colors.gold}55`; e.currentTarget.style.boxShadow = `0 0 12px ${colors.gold}22` }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1e2d36'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.15)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)' }}
              onFocus={e => { e.currentTarget.style.background = '#23333d'; e.currentTarget.style.borderColor = `${colors.gold}55` }}
              onBlur={e => { e.currentTarget.style.background = '#1e2d36'; e.currentTarget.style.borderColor = 'rgba(247,206,62,0.15)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={colors.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {chatUnread > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%',
                  background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                }}>
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </button>
          )}

          {/* Wallet — ConnectKit ConnectKitButton */}
          <ConnectKitButton.Custom>
            {({ show, isConnected, isConnecting }) => {
              if (isConnecting) {
                return <div style={{ width: isMobile ? 60 : 100, height: isMobile ? 28 : 32, borderRadius: radii.md, background: 'rgba(197,193,192,0.04)', animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200px 100%', backgroundImage: 'linear-gradient(90deg, rgba(197,193,192,0.03) 0%, rgba(197,193,192,0.08) 50%, rgba(197,193,192,0.03) 100%)' }} />
              }

              return (
                <div>
                  {!isConnected ? (
                    <button onClick={show} aria-label="Connect wallet" style={{ background: colors.gold, color: '#000', border: 'none', padding: isMobile ? '5px 8px' : '8px 14px', fontWeight: 700, borderRadius: radii.md, cursor: 'pointer', fontSize: isMobile ? 11 : fontSizes.base, whiteSpace: 'nowrap' }}>
                      {isMobile ? 'Connect' : 'Connect Wallet'}
                    </button>
                  ) : (
                    <>
                      <div ref={walletMenuRef} style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowWalletMenu(!showWalletMenu)}
                          aria-label={`Wallet menu — ${address.slice(0, 6)}...${address.slice(-4)}`}
                          aria-expanded={showWalletMenu}
                          style={{ background: colors.bgCard, color: colors.textPrimary, border: '2px solid rgba(197,193,192,0.06)', padding: isMobile ? '6px 12px' : '8px 20px', borderRadius: radii.md, cursor: 'pointer', fontSize: isMobile ? 10 : 12, fontFamily: "'Space Mono', monospace", transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = `${colors.gold}33` }}
                          onMouseLeave={e => { e.currentTarget.style.background = colors.bgCard; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.06)' }}
                          onFocus={e => { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = `${colors.gold}33` }}
                          onBlur={e => { e.currentTarget.style.background = colors.bgCard; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.06)' }}>
                          {address.slice(0, 6)}...{address.slice(-4)}
                        </button>
                        {showWalletMenu && (
                          <div role="menu" aria-label="Wallet menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: colors.bgElevated, border: `1px solid ${colors.borderLight}`, borderRadius: radii.md, zIndex: 999, overflow: 'hidden', minWidth: 'max-content', maxWidth: isMobile ? 'calc(100vw - 32px)' : 'none' }}>
                            <button onClick={() => { setTab('profile'); setShowWalletMenu(false) }} role="menuitem" aria-label="View profile" style={{ width: '100%', background: 'transparent', color: colors.textPrimary, border: 'none', padding: '8px 20px', textAlign: 'left', cursor: 'pointer', fontSize: fontSizes.base, fontFamily: "'Space Mono', monospace", transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,206,62,0.06)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              onFocus={e => e.currentTarget.style.background = 'rgba(247,206,62,0.06)'}
                              onBlur={e => e.currentTarget.style.background = 'transparent'}>
                              Profile
                            </button>
                            <a
                              href={`https://liteforge.explorer.caldera.xyz/address/${address}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', padding: '8px 20px', borderTop: `1px solid ${colors.borderLight}`, borderBottom: `1px solid ${colors.borderLight}`, color: colors.gold, fontSize: fontSizes.base, fontFamily: "'Space Mono', monospace", textAlign: 'left', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,206,62,0.06)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              onFocus={e => e.currentTarget.style.background = 'rgba(247,206,62,0.06)'}
                              onBlur={e => e.currentTarget.style.background = 'transparent'}>
                              {balance === undefined ? 'Loading...' : Number(balance.value) > 0 ? `${(Number(balance.value) / 1e18).toFixed(4)} ${balance.symbol}` : '0 zkLTC'}
                            </a>
                            {isWrongNetwork && (
                              <button onClick={() => { onSwitchNetwork(); setShowWalletMenu(false) }} role="menuitem" aria-label="Switch network" style={{ width: '100%', background: 'transparent', color: colors.red, border: 'none', padding: '8px 20px', textAlign: 'left', cursor: 'pointer', fontSize: fontSizes.base, transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                onFocus={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                                onBlur={e => e.currentTarget.style.background = 'transparent'}>
                                Switch Network
                              </button>
                            )}
                            <button onClick={() => { disconnect(); setShowWalletMenu(false) }} role="menuitem" aria-label="Disconnect wallet" style={{ width: '100%', background: 'transparent', color: colors.red, border: 'none', padding: '8px 20px', textAlign: 'left', cursor: 'pointer', fontSize: fontSizes.base, fontFamily: "'Space Mono', monospace", transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              onFocus={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
                              onBlur={e => e.currentTarget.style.background = 'transparent'}>
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
          </ConnectKitButton.Custom>

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen) }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-drawer"
              style={{ position: 'relative', zIndex: 201, background: colors.bgCard, border: '2px solid rgba(197,193,192,0.06)', padding: '6px 8px', borderRadius: radii.md, cursor: 'pointer', fontSize: 14, lineHeight: 1, color: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = `${colors.gold}33` }}
              onMouseLeave={e => { e.currentTarget.style.background = colors.bgCard; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.06)' }}
              onFocus={e => { e.currentTarget.style.background = 'rgba(247,206,62,0.06)'; e.currentTarget.style.borderColor = `${colors.gold}33` }}
              onBlur={e => { e.currentTarget.style.background = colors.bgCard; e.currentTarget.style.borderColor = 'rgba(197,193,192,0.06)' }}>
              {mobileMenuOpen ? (
                <span style={{ display: 'block', width: 14, height: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 6, left: 0, width: 14, height: 2, background: colors.textPrimary, transform: 'rotate(45deg)', borderRadius: 1 }} />
                  <span style={{ position: 'absolute', top: 6, left: 0, width: 14, height: 2, background: colors.textPrimary, transform: 'rotate(-45deg)', borderRadius: 1 }} />
                </span>
              ) : (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ width: 14, height: 2, background: colors.textPrimary, borderRadius: 1 }} />
                  <span style={{ width: 14, height: 2, background: colors.textPrimary, borderRadius: 1 }} />
                  <span style={{ width: 14, height: 2, background: colors.textPrimary, borderRadius: 1 }} />
                </span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {isMobile && (
        <div onClick={() => setMobileMenuOpen(false)} style={{
          position: 'fixed', top: navHeight, left: 0, right: 0, bottom: 0, zIndex: 85,
          background: 'rgba(0,0,0,0.5)',
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }} />
      )}

      {/* Mobile menu drawer */}
      {isMobile && (
        <div ref={menuRef} id="mobile-menu-drawer" style={{
          position: 'fixed', top: navHeight, left: 0, right: 0,
          background: colors.bgCard, borderBottom: `1px solid ${colors.borderLight}`,
          zIndex: 90, overflow: 'hidden',
          padding: mobileMenuOpen ? '8px 16px 16px' : '0 16px',
          maxHeight: mobileMenuOpen ? 500 : 0,
          opacity: mobileMenuOpen ? 1 : 0,
          transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'max-height 0.3s ease, opacity 0.25s ease, transform 0.3s ease, padding 0.3s ease',
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
        }}>
          {entered && (
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: isWrongNetwork ? colors.red : '#1a3c1a', color: isWrongNetwork ? '#000' : colors.green, padding: '3px 10px', borderRadius: radii.lg, fontSize: fontSizes.xs, fontWeight: 600 }}>
                {isWrongNetwork ? 'WRONG NETWORK' : 'LITFORGE TESTNET'}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tabs.map((t, i) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setMobileMenuOpen(false) }}
                aria-current={tab === t.key ? 'page' : undefined}
                style={{
                  background: tab === t.key ? colors.bgElevated : 'transparent',
                  border: tab === t.key ? `1px solid ${colors.gold}` : '1px solid transparent',
                  padding: '12px 16px',
                  color: tab === t.key ? colors.textPrimary : '#999',
                  cursor: 'pointer',
                  fontSize: fontSizes.lg,
                  borderRadius: radii.md,
                  fontWeight: 600,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  opacity: mobileMenuOpen ? 1 : 0,
                  transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-8px)',
                  transition: mobileMenuOpen ? `opacity 0.25s ease ${i * 0.04}s, transform 0.25s ease ${i * 0.04}s` : 'opacity 0.15s ease, transform 0.15s ease',
                }}>
                <span style={{ flex: 1 }}>{t.label}</span>
                {tab === t.key && <span style={{ color: colors.gold, fontSize: fontSizes.base }}>●</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Wrong network banner */}
      {isWrongNetwork && (
        <div style={{ background: colors.red, color: '#000', padding: isMobile ? '10px 14px' : '10px 24px', textAlign: 'center', fontWeight: 600, fontSize: isMobile ? 11 : 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>Wrong network — switch to LitForge Testnet (Chain ID 4441)</span>
          <button onClick={onSwitchNetwork} style={{ background: '#000', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: radii.sm, fontWeight: 700, cursor: 'pointer', fontSize: fontSizes.base, minHeight: isMobile ? 44 : 36 }}>
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
      background: active ? 'rgba(247,206,62,0.1)' : 'rgba(197,193,192,0.04)',
      border: active ? `2px solid ${colors.gold}55` : '2px solid rgba(197,193,192,0.06)',
      padding: '7px 14px',
      color: active ? colors.textPrimary : colors.textDim,
      cursor: 'pointer',
      fontSize: fontSizes.base,
      borderRadius: radii.md,
      fontWeight: 600,
      minWidth: 90,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      {label}
    </button>
  )
}

// Memoized Navbar (prevents unnecessary re-renders from heavy parent state updates during tab switches)
export const Navbar = memo(NavbarImpl)