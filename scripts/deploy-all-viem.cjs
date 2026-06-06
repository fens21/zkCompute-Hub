require('dotenv').config()
const { createWalletClient, createPublicClient, http } = require('viem')
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
  const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`

  const account = privateKeyToAccount(pk)
  const publicClient = createPublicClient({ chain: litforge, transport: http() })
  const walletClient = createWalletClient({ account, chain: litforge, transport: http() })

  console.log('Deployer:', account.address)
  const balance = await publicClient.getBalance({ address: account.address })
  console.log('Balance:', balance.toString(), 'wei')

  // ---- 1. Deploy JobMarketplace ----
  console.log('\n--- Deploying JobMarketplace ---')
  const jmBytecode = fs.readFileSync(
    path.join(__dirname, '..', 'build', 'contracts_JobMarketplace_sol_JobMarketplace.bin'), 'utf8'
  ).trim()
  const jmAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'build', 'contracts_JobMarketplace_sol_JobMarketplace.abi'), 'utf8')
  )

  const jmHash = await walletClient.deployContract({
    abi: jmAbi,
    bytecode: `0x${jmBytecode}`,
    args: [],
  })
  const jmReceipt = await publicClient.waitForTransactionReceipt({ hash: jmHash })
  const jmAddress = jmReceipt.contractAddress
  console.log('JobMarketplace deployed to:', jmAddress)

  // Verify deployer is owner
  const onChainOwner = await publicClient.readContract({
    address: jmAddress,
    abi: jmAbi,
    functionName: 'owner',
  })
  console.log('Owner:', onChainOwner)
  if (onChainOwner.toLowerCase() !== account.address.toLowerCase()) {
    console.error('Owner mismatch! Aborting.')
    process.exit(1)
  }

  // ---- 2. Deploy RealVerifier ----
  console.log('\n--- Deploying RealVerifier ---')
  const rvBytecode = fs.readFileSync(
    path.join(__dirname, '..', 'build', 'contracts_RealVerifier_sol_RealVerifier.bin'), 'utf8'
  ).trim()
  const rvAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'build', 'contracts_RealVerifier_sol_RealVerifier.abi'), 'utf8')
  )

  const rvHash = await walletClient.deployContract({
    abi: rvAbi,
    bytecode: `0x${rvBytecode}`,
    args: [],
  })
  const rvReceipt = await publicClient.waitForTransactionReceipt({ hash: rvHash })
  const rvAddress = rvReceipt.contractAddress
  console.log('RealVerifier deployed to:', rvAddress)

  // ---- 3. setVerifier on JobMarketplace ----
  console.log('\n--- Setting verifier on JobMarketplace ---')
  const { request } = await publicClient.simulateContract({
    address: jmAddress,
    abi: jmAbi,
    functionName: 'setVerifier',
    args: [rvAddress],
    account,
  })
  const svHash = await walletClient.writeContract(request)
  await publicClient.waitForTransactionReceipt({ hash: svHash })
  console.log('setVerifier() succeeded')

  // ---- 4. Verify ----
  const verifierAddr = await publicClient.readContract({
    address: jmAddress,
    abi: jmAbi,
    functionName: 'verifier',
  })
  const zkOn = await publicClient.readContract({
    address: jmAddress,
    abi: jmAbi,
    functionName: 'zkEnabled',
  })
  console.log('\nVerification:')
  console.log('  verifier =>', verifierAddr)
  console.log('  zkEnabled =>', zkOn)

  console.log('\n=== DEPLOYMENT SUMMARY ===')
  console.log(`VITE_CONTRACT_ADDRESS=${jmAddress}`)
  console.log(`RealVerifier=${rvAddress}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
