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

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x424a2C3F675DD841e7F04280C1338DA2D741866E'
export const USDC_ADDRESS = '0xd5118dEe968d1533B2A57aB66C266010AD8957fa'

export const config = createConfig({
  chains: [litforge],
  connectors: [injected()],
  transports: {
    [litforge.id]: http()
  }
})
