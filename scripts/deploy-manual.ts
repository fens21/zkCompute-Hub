// Cara pakai:
// 1. Compile contract di mana saja (Remix / online compiler)
// 2. Copy ABI dan Bytecode
// 3. Paste di bawah ini
// 4. Jalankan: npx tsx scripts/deploy-manual.ts

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import 'dotenv/config'

const litforge = {
  id: 4441,
  name: 'LitForge',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
}

const ABI = [] // <-- paste ABI di sini
const BYTECODE = '0x' // <-- paste bytecode di sini

async function main() {
  const pk = process.env.PRIVATE_KEY as `0x${string}`
  const account = privateKeyToAccount(pk)
  
  const client = createWalletClient({
    account,
    chain: litforge,
    transport: http(),
  })

  console.log('Deploying from:', account.address)

  const hash = await client.deployContract({
    abi: ABI,
    bytecode: BYTECODE as `0x${string}`,
  })

  console.log('Deploy tx:', hash)
}

main().catch(console.error)
