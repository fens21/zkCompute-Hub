export function LandingPage({ onConnect, loading }: { onConnect: () => void; loading: boolean }) {
  return (
    <div style={{ background: 'radial-gradient(ellipse at 20% 80%, #0d001a 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #001a11 0%, transparent 50%), radial-gradient(ellipse at 60% 60%, #000033 0%, transparent 50%), radial-gradient(ellipse at 10% 40%, #1a0033 0%, transparent 50%), radial-gradient(ellipse at 90% 70%, #002211 0%, transparent 50%), #000000', color: '#c0c0c0', fontFamily: 'monospace', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', maxWidth: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: '#ffd700', borderRadius: 8 }}></div>
        </div>
        <h1 style={{ fontSize: 36, color: '#fff', margin: 0, letterSpacing: '-2px' }}>zkCompute Hub</h1>
        <p style={{ fontSize: 15, opacity: 0.7, marginTop: 12 }}>Verifiable Compute Marketplace on Litecoin Rollup</p>
        <div style={{ marginTop: 60 }}>
          <button 
            onClick={onConnect} 
            disabled={loading} 
            style={{ 
              background: '#ffd700', 
              color: '#000', 
              border: 'none', 
              padding: '18px 60px', 
              fontSize: 16, 
              fontWeight: 700, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              borderRadius: 8, 
              opacity: loading ? 0.6 : 1 
            }}
          >
            {loading ? 'CONNECTING...' : 'CONNECT WALLET TO ENTER'}
          </button>
        </div>
        <div style={{ marginTop: 40, fontSize: 11, opacity: 0.5 }}>Powered by zkLTC &bull; LiteForge Hackathon</div>
      </div>
    </div>
  )
}
