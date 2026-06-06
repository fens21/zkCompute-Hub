require('dotenv').config()
const { createWalletClient, createPublicClient, http } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const fs = require('fs')
const path = require('path')

const litforge = {
  id: 4441, name: 'LitForge Testnet',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) { console.error('Set PRIVATE_KEY env var'); process.exit(1) }
  const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
  const account = privateKeyToAccount(pk)
  const publicClient = createPublicClient({ chain: litforge, transport: http() })
  const walletClient = createWalletClient({ account, chain: litforge, transport: http() })

  const jmAddress = process.env.VITE_CONTRACT_ADDRESS

  // Deploy fixed RealVerifier
  const bytecode = fs.readFileSync(path.join(__dirname, '..', 'build', 'RealVerifier.bin'), 'utf8').trim()
  const abi = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'abi', 'RealVerifier.json'), 'utf8'))

  console.log('Deploying fixed RealVerifier...')
  const hash = await walletClient.deployContract({ abi, bytecode: `0x${bytecode}`, args: [] })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  const rvAddress = receipt.contractAddress
  console.log('RealVerifier deployed to:', rvAddress)

  // Set VK
  const vk = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'zk', 'build', 'verification_key_final.json'), 'utf8'))
  const toBig = (s) => BigInt(s)
  const args = [
    { X: toBig(vk.vk_alpha_1[0]), Y: toBig(vk.vk_alpha_1[1]) },
    { X: [toBig(vk.vk_beta_2[0][0]), toBig(vk.vk_beta_2[0][1])], Y: [toBig(vk.vk_beta_2[1][0]), toBig(vk.vk_beta_2[1][1])] },
    { X: [toBig(vk.vk_gamma_2[0][0]), toBig(vk.vk_gamma_2[0][1])], Y: [toBig(vk.vk_gamma_2[1][0]), toBig(vk.vk_gamma_2[1][1])] },
    { X: [toBig(vk.vk_delta_2[0][0]), toBig(vk.vk_delta_2[0][1])], Y: [toBig(vk.vk_delta_2[1][0]), toBig(vk.vk_delta_2[1][1])] },
    vk.IC.map((pt) => ({ X: toBig(pt[0]), Y: toBig(pt[1]) })),
  ]
  console.log('Setting VK...')
  const { request } = await publicClient.simulateContract({ address: rvAddress, abi, functionName: 'setVerificationKey', args, account })
  const vkHash = await walletClient.writeContract(request)
  await publicClient.waitForTransactionReceipt({ hash: vkHash })
  console.log('VK set')

  // Set verifier on JobMarketplace
  console.log('Setting verifier on JobMarketplace...')
  const jmAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'abi', 'JobMarketplace.json'), 'utf8'))
  const { request: req2 } = await publicClient.simulateContract({ address: jmAddress, abi: jmAbi, functionName: 'setVerifier', args: [rvAddress], account })
  const svHash = await walletClient.writeContract(req2)
  await publicClient.waitForTransactionReceipt({ hash: svHash })
  console.log('setVerifier done')

  console.log('\n=== NEW RealVerifier ===')
  console.log(`REAL_VERIFIER_ADDRESS=${rvAddress}`)
}

main().catch(console.error)
