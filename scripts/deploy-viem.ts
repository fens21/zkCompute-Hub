import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const litforge = {
  id: 4441,
  name: 'LitForge',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
}

async function main() {
  const pk = process.env.PRIVATE_KEY as `0x${string}`
  if (!pk) throw new Error('PRIVATE_KEY not found in .env')

  const account = privateKeyToAccount(pk)
  const client = createWalletClient({
    account,
    chain: litforge,
    transport: http(),
  })

  console.log('Deploying from:', account.address)

  // Paste bytecode hasil compile dari Remix di sini
  const bytecode = '0x...' as `0x${string}`

  const hash = await client.deployContract({
    abi: [], // paste ABI dari Remix di sini
    bytecode,
  })

  console.log('Transaction hash:', hash)
  console.log('Waiting for confirmation...')
}

main().catch(console.error)
