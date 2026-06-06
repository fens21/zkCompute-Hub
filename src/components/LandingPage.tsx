import { useState, type CSSProperties } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { colors, radii, fontSizes } from '../styles/tokens'
import '../styles/landing.css'

const gold = (a: number) => `rgba(255,215,0,${a})`

const cssVars: Record<string, string> = {
  '--lp-gold': colors.gold,
  '--lp-border-light': colors.borderLight,
  '--lp-bg-input': colors.bgInput,
  '--lp-text-dim': colors.textDim,
  '--lp-radius-xl': `${radii.xl}px`,
  '--lp-glow-gold1': gold(0.03),
  '--lp-glow-gold2': gold(0.015),
  '--lp-ring-outer-border': gold(0.06),
  '--lp-ring-inner-border': gold(0.03),
  '--lp-dot-bg': gold(0.3),
}

const titleStyle: CSSProperties = {
  fontSize: 48, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.2,
  background: `linear-gradient(135deg, ${colors.gold} 0%, #ffb700 50%, ${colors.gold} 100%)`,
  backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  marginBottom: 12,
}

const FEATURES = [
  { icon: '', title: 'Post Compute Jobs', desc: 'Create ML, ZK, rendering & AI inference jobs with escrowed payments in zkLTC or USDC' },
  { icon: '', title: 'Complete & Earn', desc: 'Workers claim jobs, run computations, submit proofs, and get paid automatically' },
  { icon: '', title: 'On-Chain Verifiable', desc: 'Every proof, payment, and dispute is recorded on the LitForge blockchain' },
]

const STEPS = [
  { num: '01', title: 'Post a Job', desc: 'Create a compute job (ML, ZK, render) with escrowed payment in zkLTC or USDC. Specify requirements, deadline, and reward.' },
  { num: '02', title: 'Get Matched', desc: 'Workers compete for your job. Review their reputation score, bond collateral, and select the best fit.' },
  { num: '03', title: 'Compute & Prove', desc: 'Worker runs the computation off-chain and generates a verifiable proof using LitVM\'s ZK framework.' },
  { num: '04', title: 'Verify & Settle', desc: 'Proof is submitted to LitVM for on-chain verification. Escrow released automatically — worker gets paid.' },
]

const FAQ_DATA = [
  { q: 'What is zkCompute Hub?', a: 'A decentralized verifiable compute marketplace built on LitVM — Litecoin\'s Virtual Machine. It connects users who need compute power with workers who provide it, with trustless payments via smart contracts.' },
  { q: 'What is zkLTC?', a: 'zkLTC is the native gas token of the LitVM ecosystem, backed 1:1 by LTC. It\'s used for transaction fees, escrow payments, and staking on zkCompute Hub.' },
  { q: 'How do I get started?', a: 'Connect your EVM wallet (MetaMask, Rabby), add the LitVM network (chain ID 4441), get testnet zkLTC from the faucet, and post or claim your first compute job.' },
  { q: 'What kind of jobs can I post?', a: 'ML training & inference, ZK proof generation (Groth16, PLONK), 3D rendering, generic compute tasks, and more. Any computational workload that can produce a verifiable proof.' },
  { q: 'How are disputes handled?', a: 'Disputes are resolved via LitVM\'s on-chain verification. If a proof fails verification, the escrow is returned to the job poster and the worker\'s bond is slashed.' },
  { q: 'Is this mainnet?', a: 'Currently on LitVM\'s LiteForge testnet (chain ID 4441). No real funds are used. Mainnet launch will be announced by the LitVM team.' },
  { q: 'How much does it cost to post a job?', a: 'You only pay the job reward + network gas fees. There are no platform fees. The full amount is escrowed on-chain until the job is completed and verified.' },
  { q: 'Can I run jobs on my own hardware?', a: 'Yes. Workers can use any machine they control. The only requirement is that they can generate a valid zero-knowledge proof for the job\'s expected output.' },
]

const ADVANTAGES = [
  {
    title: 'Zero Trust, Full Proof',
    desc: 'Every computation is cryptographically proven. Posters never have to trust workers — the math guarantees the result.',
  },
  {
    title: 'Automatic & Instant Payouts',
    desc: 'Escrowed funds are released the moment a valid proof is verified on-chain. No delays, no disputes over delivery.',
  },
  {
    title: 'Any Workload Welcome',
    desc: 'ML inference, ZK proving, 3D rendering, data labeling, scientific simulations — if it can be proven, it can be posted.',
  },
  {
    title: 'Real Bitcoin Security',
    desc: 'Powered by LitVM on Litecoin. Low fees, strong security, and settlement backed by actual Bitcoin money.',
  },
]

const sectionHdr: CSSProperties = {
  textAlign: 'center', marginBottom: 48,
}
const sectionTitle: CSSProperties = {
  fontSize: 32, fontWeight: 700, letterSpacing: '-1px',
  color: colors.gold, marginBottom: 8,
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [copyAnnounce, setCopyAnnounce] = useState('')
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const scrollToCta = () => {
    const el = document.getElementById('hero')
    if (el) el.scrollIntoView({ block: 'start' })
    setTimeout(() => {
      const btn = document.getElementById('lp-connect-top')
      if (btn) {
        btn.classList.add('lp-cta-highlight')
        setTimeout(() => btn.classList.remove('lp-cta-highlight'), 1700)
      }
    }, 500)
  }

  const copy = (v: string) => {
    navigator.clipboard.writeText(v)
    setCopied(v)
    setCopyAnnounce(`Copied ${v}`)
    setTimeout(() => { setCopied(null); setCopyAnnounce('') }, 1200)
  }

  const ctaBtnSx: CSSProperties = {
    background: `linear-gradient(135deg, ${colors.gold}, #e6a800)`,
    color: colors.bgInput, border: 'none', padding: '10px 24px', fontSize: fontSizes.md, fontWeight: 700,
    cursor: 'pointer', borderRadius: radii.md, opacity: 1,
    transition: prefersReducedMotion ? 'none' : 'transform 0.2s, box-shadow 0.2s',
    animation: prefersReducedMotion ? 'none' : 'glow 3s ease-in-out infinite', letterSpacing: '0.5px',
  }

  return (
    <div style={{
      ...cssVars, color: colors.textSecondary,
      fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    }}>
      <main>
      {/* ── Hero ── */}
      <section className="lp-hero-section" aria-label="Hero" id="hero">
        <div className="lp-aurora" />
        <div className="lp-aurora2" />
        <div className="lp-ring lp-ring-outer" />
        <div className="lp-ring lp-ring-inner" />
        <div className="lp-dot" style={{ top: '38%', left: '38%', animationDelay: '0s' }} />
        <div className="lp-dot" style={{ top: '62%', left: '62%', animationDelay: '2s' }} />
        <div className="lp-glow" />
        <div className="lp-grid" />
        <div className="lp-stars" />

        <div className="lp-hero-content">
          <div style={{ animation: 'fadeIn 0.8s ease-out 0s both' }}>
            <h1 className="lp-title" style={titleStyle}>zkCompute Hub</h1>
            <p style={{ fontSize: 16, color: colors.textSecondary, maxWidth: 580, margin: '0 auto', lineHeight: 1.5 }}>
              The decentralized marketplace for verifiable compute. Post AI, ML, ZK, and rendering jobs with escrowed payments. 
              Workers prove results using zero-knowledge proofs — no trust required. Automatic on-chain settlement powered by LitVM.
            </p>
          </div>

          <div className="lp-cta-row" style={{ animation: 'fadeIn 0.8s ease-out 0.2s both', marginTop: 48 }}>
            <ConnectButton.Custom>
              {({ openConnectModal, authenticationStatus, mounted }) => {
                const ready = mounted && authenticationStatus !== 'loading'
                return (
                  <button id="lp-connect-top" onClick={openConnectModal} disabled={!ready} aria-label="Connect wallet to enter"
                    className="lp-cta" style={{ ...ctaBtnSx, opacity: ready ? 1 : 0.6, cursor: ready ? 'pointer' : 'not-allowed' }}>
                    {authenticationStatus === 'loading' ? <><span className="lp-spinner" />LOADING…</> : 'CONNECT WALLET'}
                  </button>
                )
              }}
            </ConnectButton.Custom>
          </div>

          <div className="lp-features" style={{ animation: 'fadeIn 0.8s ease-out 0.6s both', display: 'flex', gap: 24, justifyContent: 'center', marginTop: 52, marginBottom: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: fontSizes.md, fontWeight: 700, color: colors.gold, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: fontSizes.base, color: colors.textDim, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>


        </div>

      </section>

      {/* ── How It Works ── */}
      <section className="lp-section" aria-label="How It Works" id="how-it-works">
        <div style={sectionHdr}>
          <h2 style={sectionTitle}>How It Works</h2>
          <p style={{ color: colors.textDim, fontSize: fontSizes.lg }}>Post a job with escrowed payment. Workers compete and prove their results. Everything settles automatically on-chain.</p>
        </div>
        <div className="lp-steps-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="lp-step-card">
              <div className="lp-step-num">{s.num}</div>
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why zkCompute Hub ── */}
      <section className="lp-section" aria-label="Why zkCompute Hub">
        <div style={sectionHdr}>
          <h2 style={sectionTitle}>Why zkCompute Hub?</h2>
          <p style={{ color: colors.textDim, fontSize: fontSizes.lg, maxWidth: 520, margin: '0 auto' }}>
            Built for developers, researchers, and teams who need real compute — without the trust issues.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {ADVANTAGES.map((adv, i) => (
            <div key={i} className="lp-feature-card" style={{ minHeight: 'auto', padding: '24px 20px', textAlign: 'left' }}>
              <div style={{ fontSize: fontSizes.md, fontWeight: 700, color: colors.gold, marginBottom: 10 }}>{adv.title}</div>
              <p style={{ fontSize: fontSizes.base, color: colors.textDim, lineHeight: 1.55, margin: 0 }}>{adv.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Network Info ── */}
      <section className="lp-section lp-section-alt" aria-label="Network Information" id="network">
        <div style={sectionHdr}>
          <h2 style={sectionTitle}>zkCompute Hub Network</h2>
          <p style={{ color: colors.textDim, fontSize: fontSizes.lg }}>Built on LitVM — Litecoin's Virtual Machine</p>
        </div>
        <div role="status" aria-live="polite" className="sr-only">{copyAnnounce}</div>
        <div className="lp-net-grid">
          {[
            ['Network Name', 'LitVM LiteForge'],
            ['Chain ID', '4441'],
            ['Gas Token', 'zkLTC (1:1 backed by LTC)'],
            ['RPC (HTTP)', 'https://liteforge.rpc.caldera.xyz/http'],
            ['RPC (WebSocket)', 'wss://liteforge.rpc.caldera.xyz/ws'],
            ['Block Explorer', 'https://liteforge.explorer.caldera.xyz'],
          ].map(([label, value], i) => (
            <div key={i} className="lp-net-item">
              <span className="lp-net-label">{label}</span>
              <span className="lp-net-value" style={{ fontFamily: "'Space Mono', monospace" }}>
                {value}
                {['Chain ID', 'RPC (HTTP)', 'RPC (WebSocket)', 'Block Explorer'].includes(label) && (
                  <button className="lp-copy-btn" onClick={() => copy(value)} aria-label={`Copy ${label}`}>
                    {copied === value ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    )}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="lp-quick-links">
          <a href="https://liteforge.explorer.caldera.xyz" target="_blank" rel="noopener noreferrer" className="lp-ql-link">Explorer</a>
          <a href="https://liteforge.hub.caldera.xyz" target="_blank" rel="noopener noreferrer" className="lp-ql-link">Faucet</a>
          <a href="https://docs.litvm.com" target="_blank" rel="noopener noreferrer" className="lp-ql-link">Docs</a>
          <a href="https://litvm.com" target="_blank" rel="noopener noreferrer" className="lp-ql-link">LitVM</a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-section" aria-label="Frequently Asked Questions" id="faq">
        <div style={sectionHdr}>
          <h2 style={sectionTitle}>Common Questions</h2>
          <p style={{ color: colors.textDim, fontSize: fontSizes.lg }}>Everything you need to know about zkCompute Hub</p>
        </div>
        <div className="lp-faq">
          {FAQ_DATA.map((item, i) => (
            <div key={i} className={`lp-faq-item${openFaq === i ? ' open' : ''}`}>
              <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i} aria-controls={`faq-answer-${i}`}>
                <span>{item.q}</span>
                <span className="lp-faq-arrow">{openFaq === i ? '−' : '+'}</span>
              </button>
              <div id={`faq-answer-${i}`} role="region" className="lp-faq-a" style={{ maxHeight: openFaq === i ? 300 : 0 }}>{item.a}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button onClick={scrollToCta}
            aria-label="Get started" className="lp-cta" style={{ ...ctaBtnSx, animation: 'glow 3s ease-in-out infinite' }}>
            GET STARTED
          </button>
        </div>
      </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div style={{ fontSize: fontSizes.lg, fontWeight: 700, color: colors.gold }}>zkCompute Hub</div>
          <div style={{ fontSize: fontSizes.sm, color: 'rgba(197, 193, 192, 0.85)', marginTop: -4 }}>Decentralized verifiable compute on LitVM</div>
          <div className="lp-footer-social">
            <a href="https://x.com/fens21_" target="_blank" rel="noopener noreferrer" aria-label="Follow on X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://github.com/fens21/zkCompute-Hub" target="_blank" rel="noopener noreferrer" aria-label="View on GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          LitVM &bull; Litecoin's Virtual Machine &bull; Hard Money Web3
          <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(197, 193, 192, 0.8)' }}>
            © {new Date().getFullYear()} zkCompute Hub. All rights reserved. • Testnet only • Not financial advice
          </div>
        </div>
      </footer>
    </div>
  )
}
