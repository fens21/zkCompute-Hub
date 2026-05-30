export function Logo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size * 3.5} height={size} viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffb700" />
          <stop offset="100%" stopColor="#ffd700" />
        </linearGradient>
      </defs>
      <rect x="2" y="10" width="60" height="60" rx="14" stroke="url(#logo-gold)" strokeWidth="2" fill="rgba(255,215,0,0.05)" />
      <path d="M18 26 L34 26 L34 31 L23 31 L23 35 L32 35 L32 40 L23 40 L23 44 L34 44 L34 49 L18 49 Z"
        fill="url(#logo-gold)" />
      <path d="M38 26 L44 26 L44 36 L48 36 L48 26 L54 26 L54 49 L48 49 L48 41 L44 41 L44 49 L38 49 Z"
        fill="url(#logo-gold)" />
      <text x="74" y="50" fontFamily="'Space Mono', monospace" fontSize="26" fontWeight="700" letterSpacing="1"
        fill="url(#logo-gold)">
        zkCompute
      </text>
      <text x="74" y="68" fontFamily="'Space Mono', monospace" fontSize="16" fontWeight="400" letterSpacing="3"
        fill="rgba(255,215,0,0.5)">
        HUB
      </text>
    </svg>
  )
}
