require('dotenv').config()
const { createWalletClient, createPublicClient, http, deployContract } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const fs = require('fs')
const path = require('path')

const litforge = {
  id: 4441,
  name: 'LitForge Testnet',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    console.error('Set PRIVATE_KEY env var')
    process.exit(1)
  }

  const jobMarketplaceAddress = process.env.JOB_MARKETPLACE_ADDRESS || process.env.VITE_CONTRACT_ADDRESS || '0x424a2C3F675DD841e7F04280C1338DA2D741866E'

  const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`)
  const publicClient = createPublicClient({ chain: litforge, transport: http() })
  const walletClient = createWalletClient({ account, chain: litforge, transport: http() })

  const bytecode = fs.readFileSync(
    path.join(__dirname, '..', 'build', 'contracts_RealVerifier_sol_RealVerifier.bin'),
    'utf8'
  ).trim()
  const abi = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'build', 'contracts_RealVerifier_sol_RealVerifier.abi'), 'utf8')
  )

  console.log('Deploying RealVerifier...')
  const hash = await walletClient.deployContract({
    abi,
    bytecode: `0x${bytecode}`,
    args: [],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const rvAddress = receipt.contractAddress
  console.log('RealVerifier deployed to:', rvAddress)

  const jmAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'abi', 'JobMarketplace.json'), 'utf8')
  )
  console.log('Setting verifier on JobMarketplace at', jobMarketplaceAddress)
  const { request } = await publicClient.simulateContract({
    address: jobMarketplaceAddress,
    abi: jmAbi,
    functionName: 'setVerifier',
    args: [rvAddress],
    account,
  })
  const txHash = await walletClient.writeContract(request)
  await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log('Verifier set successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
