import { createConfig, http } from 'wagmi'
import { getDefaultConfig } from 'connectkit'
import type { Chain } from 'viem/chains'

export const litforge = {
  id: 4441,
  name: 'LitForge Testnet',
  nativeCurrency: {
    name: 'zkLTC',
    symbol: 'zkLTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://liteforge.rpc.caldera.xyz/http'] }
  }
} as const satisfies Chain

// Forced to fresh clean contract so old posts/history are guaranteed gone
// even if old VITE_CONTRACT_ADDRESS still lingers in Vercel dashboard.
export const CONTRACT_ADDRESS = '0xaaf4555aad78b7981e4e619124a28fc137faffd8'
export const USDC_ADDRESS = '0xd5118dEe968d1533B2A57aB66C266010AD8957fa'

export const config = createConfig(
  getDefaultConfig({
    chains: [litforge],
    transports: {
      [litforge.id]: http()
    },
    appName: 'zkCompute Hub',
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  })
)
