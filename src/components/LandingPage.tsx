import type { CSSProperties } from 'react'
import heroImg from '../assets/hero.png'

const titleStyle: CSSProperties = {
  fontSize: 48, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.2,
  background: 'linear-gradient(135deg, #ffd700 0%, #ffb700 50%, #ffd700 100%)',
  backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  marginBottom: 12,
}
const ctaBtnStyle = (loading: boolean): CSSProperties => ({
  background: loading ? '#ffd700' : 'linear-gradient(135deg, #ffd700, #e6a800)',
  color: '#000', border: 'none', padding: '16px 56px', fontSize: 15, fontWeight: 700,
  cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 10, opacity: loading ? 0.6 : 1,
  transition: 'transform 0.2s, box-shadow 0.2s',
  animation: loading ? 'none' : 'glow 3s ease-in-out infinite', letterSpacing: '0.5px',
})
const sectionFade = (delay: string): CSSProperties => ({
  animation: `fadeIn 0.8s ease-out ${delay} both`,
})

const STEPS = [
  { num: '1', label: 'Post Job', sub: '& Escrow' },
  { num: '2', label: 'Worker Claims', sub: '& Computes' },
  { num: '3', label: 'Proof Submitted', sub: '& Payment Released' },
]
const FEATURES = [
  { icon: '⚡', title: 'Post Compute Jobs', desc: 'Create ML, ZK, rendering & AI inference jobs with escrowed payments in zkLTC or USDC' },
  { icon: '🏗️', title: 'Complete & Earn', desc: 'Workers claim jobs, run computations, submit proofs, and get paid automatically' },
  { icon: '🔗', title: 'On-Chain Verifiable', desc: 'Every proof, payment, and dispute is recorded on the LitForge blockchain' },
]

export function LandingPage({ onConnect, loading }: { onConnect: () => void; loading: boolean }) {
  return (
    <>
      <style>{`
        .lp-feature-card {
          background: rgba(17,17,17,0.8);
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 24px 20px;
          flex: 1;
          min-width: 200px;
          max-width: 260px;
          text-align: center;
          transition: border-color 0.3s, transform 0.3s;
        }
        .lp-feature-card:hover {
          border-color: #ffd700 !important;
          transform: translateY(-4px) !important;
        }
        .lp-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spinner 0.6s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spinner { to { transform: rotate(360deg); } }

        .lp-grid {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.3;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridDrift 20s linear infinite;
        }
        .lp-aurora, .lp-aurora2 {
          position: absolute; inset: 0; pointer-events: none;
        }
        .lp-aurora { animation: auroraDrift 12s ease-in-out infinite alternate; }
        .lp-aurora2 { animation: auroraDrift2 16s ease-in-out infinite alternate; }
        .lp-aurora::before, .lp-aurora2::before {
          content: ''; position: absolute; inset: -100px; filter: blur(60px);
        }
        .lp-aurora::before {
          background:
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(0,180,200,0.06) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(120,50,200,0.05) 0%, transparent 50%);
        }
        .lp-aurora2::before {
          filter: blur(80px);
          background:
            radial-gradient(ellipse 70% 60% at 70% 30%, rgba(0,200,150,0.04) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 30% 70%, rgba(200,50,150,0.03) 0%, transparent 50%);
        }
        .lp-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 30%, rgba(255,215,0,0.015) 0%, transparent 40%);
          animation: breathe 6s ease-in-out infinite;
        }
        .lp-hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: url(${heroImg}) center center / 400px auto no-repeat;
          animation: heroFloat 8s ease-in-out infinite;
          filter: drop-shadow(0 0 60px rgba(255,215,0,0.06)) drop-shadow(0 0 120px rgba(255,215,0,0.04));
        }
        .lp-ring {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%; pointer-events: none;
        }
        .lp-ring-outer {
          width: 380px; height: 380px;
          border: 1px solid rgba(255,215,0,0.06);
          animation: ringSpin 20s linear infinite;
        }
        .lp-ring-inner {
          width: 260px; height: 260px;
          border: 1px dashed rgba(255,215,0,0.03);
          animation: ringSpinReverse 25s linear infinite;
        }
        .lp-dot {
          position: absolute; width: 3px; height: 3px;
          background: rgba(255,215,0,0.3);
          border-radius: 50%; pointer-events: none;
          animation: dotFloat 6s ease-in-out infinite;
        }

        @keyframes gridDrift { 0% { background-position: 0 0; } 100% { background-position: 60px 60px; } }
        @keyframes breathe { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes heroFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
        @keyframes ringSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes ringSpinReverse { to { transform: translate(-50%, -50%) rotate(-360deg); } }
        @keyframes dotFloat { 0%, 100% { transform: translateY(0); opacity: 0.2; } 50% { transform: translateY(-20px); opacity: 0.6; } }
        @keyframes auroraDrift { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, -20px); } }
        @keyframes auroraDrift2 { 0% { transform: translate(0, 0); } 100% { transform: translate(-20px, 30px); } }

        @media (max-width: 768px) {
          .lp-title { font-size: 32px !important; letter-spacing: -1px !important; }
          .lp-features { flex-wrap: wrap !important; }
          .lp-feature-card { min-width: 160px !important; max-width: 100% !important; }
          .lp-steps { gap: 12px !important; font-size: 10px !important; }
          .lp-steps-sep { width: 20px !important; }
          .lp-cta { padding: 14px 32px !important; font-size: 13px !important; width: 100% !important; max-width: 280px !important; }
          .lp-cta-row { margin-top: 32px !important; }
          .lp-features { margin-top: 48px !important; }
          .lp-steps-wrap { margin-top: 24px !important; }
        }
        @media (max-width: 480px) {
          .lp-title { font-size: 26px !important; }
          .lp-feature-card { padding: 16px 14px !important; min-width: 140px !important; }
          .lp-feature-card div:first-child { font-size: 22px !important; }
          .lp-steps { flex-wrap: wrap !important; gap: 8px !important; }
          .lp-steps-sep { display: none !important; }
        }
      `}</style>

      <div style={{
        color: '#c0c0c0', fontFamily: "'Space Mono', monospace", minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', position: 'relative', overflow: 'hidden',
      }}>
        <div className="lp-aurora" />
        <div className="lp-aurora2" />
        <div className="lp-hero-bg" />
        <div className="lp-ring lp-ring-outer" />
        <div className="lp-ring lp-ring-inner" />
        <div className="lp-dot" style={{ top: '38%', left: '38%', animationDelay: '0s' }} />
        <div className="lp-dot" style={{ top: '62%', left: '62%', animationDelay: '2s' }} />
        <div className="lp-dot" style={{ top: '35%', left: '65%', animationDelay: '4s' }} />
        <div className="lp-glow" />
        <div className="lp-grid" />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 900, padding: '0 24px' }}>
          <div style={sectionFade('0s')}>
            <div className="lp-title" style={titleStyle}>zkCompute Hub</div>
            <p style={{ fontSize: 16, opacity: 0.6, maxWidth: 540, margin: '0 auto' }}>
              Decentralized verifiable compute marketplace on LitVM — Litecoin's Virtual Machine.
              Hard Money Web3, powered by BitcoinOS.
            </p>
          </div>

          <div className="lp-cta-row" style={{ ...sectionFade('0.2s'), marginTop: 48 }}>
            <button onClick={onConnect} disabled={loading} aria-label="Connect wallet to enter"
              className="lp-cta" style={ctaBtnStyle(loading)}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}>
              {loading ? <><span className="lp-spinner" />CONNECTING...</> : 'CONNECT WALLET'}
            </button>
          </div>

          <div className="lp-steps-wrap" style={{ ...sectionFade('0.4s'), marginTop: 32 }}>
            <div className="lp-steps" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36,
              fontSize: 11, opacity: 0.7,
            }}>
              {STEPS.flatMap((s, i) => [
                <div key={`s${i}`} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, color: '#ffd700', fontWeight: 700, marginBottom: 2 }}>{s.num}</div>
                  <div>{s.label}<br />{s.sub}</div>
                </div>,
                i < STEPS.length - 1
                  ? <div key={`sep${i}`} className="lp-steps-sep" style={{ width: 40, height: 1, background: '#555' }} />
                  : null,
              ])}
            </div>
          </div>

          <div className="lp-features" style={{ ...sectionFade('0.6s'), display: 'flex', gap: 24, justifyContent: 'center', marginTop: 52, marginBottom: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffd700', marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 11, opacity: 0.6, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          textAlign: 'center', fontSize: 11, opacity: 0.4, zIndex: 1,
        }}>
          LitVM &bull; Litecoin's Virtual Machine &bull; Hard Money Web3
        </div>
      </div>
    </>
  )
}
