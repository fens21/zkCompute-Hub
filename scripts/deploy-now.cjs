require('dotenv').config()
const { createWalletClient, createPublicClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const fs = require('fs')

const litforge = {
  id: 4441,
  name: 'LitForge Testnet',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
}

async function main() {
  const pk = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`
  const account = privateKeyToAccount(pk)
  const publicClient = createPublicClient({ chain: litforge, transport: http() })
  const walletClient = createWalletClient({ account, chain: litforge, transport: http() })

  console.log('Deployer:', account.address)
  const bal = await publicClient.getBalance({ address: account.address })
  console.log('Balance:', bal.toString(), 'wei')

  // Load artifacts
  const jmArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/JobMarketplace.sol/JobMarketplace.json', 'utf8'))
  const rvArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/RealVerifier.sol/RealVerifier.json', 'utf8'))

  // Deploy JobMarketplace
  console.log('\n--- Deploying JobMarketplace ---')
  const jmHash = await walletClient.deployContract({
    abi: jmArtifact.abi,
    bytecode: jmArtifact.bytecode,
    args: [],
  })
  const jmReceipt = await publicClient.waitForTransactionReceipt({ hash: jmHash })
  const jmAddress = jmReceipt.contractAddress
  console.log('JobMarketplace:', jmAddress)

  const owner = await publicClient.readContract({ address: jmAddress, abi: jmArtifact.abi, functionName: 'owner' })
  console.log('Owner:', owner)

  // Deploy RealVerifier
  console.log('\n--- Deploying RealVerifier ---')
  const rvHash = await walletClient.deployContract({
    abi: rvArtifact.abi,
    bytecode: rvArtifact.bytecode,
    args: [],
  })
  const rvReceipt = await publicClient.waitForTransactionReceipt({ hash: rvHash })
  const rvAddress = rvReceipt.contractAddress
  console.log('RealVerifier:', rvAddress)

  // setVerifier
  console.log('\n--- Setting verifier ---')
  const { request } = await publicClient.simulateContract({
    address: jmAddress, abi: jmArtifact.abi, functionName: 'setVerifier', args: [rvAddress], account,
  })
  const svHash = await walletClient.writeContract(request)
  await publicClient.waitForTransactionReceipt({ hash: svHash })
  console.log('Verifier set!')

  // Verify
  const onChainVerifier = await publicClient.readContract({ address: jmAddress, abi: jmArtifact.abi, functionName: 'verifier' })
  const zkOn = await publicClient.readContract({ address: jmAddress, abi: jmArtifact.abi, functionName: 'zkEnabled' })
  console.log('\nVerifier:', onChainVerifier, 'ZK enabled:', zkOn)

  console.log('\n=== DEPLOYMENT SUMMARY ===')
  console.log(`VITE_CONTRACT_ADDRESS=${jmAddress}`)
  console.log(`REAL_VERIFIER_ADDRESS=${rvAddress}`)
}

main().catch(e => { console.error(e); process.exit(1) })
