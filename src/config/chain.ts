import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { type Chain } from 'wagmi/chains'

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

export const config = createConfig({
  chains: [litforge],
  connectors: [injected()],
  transports: {
    [litforge.id]: http()
  }
})
