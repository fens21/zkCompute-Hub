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

  const rvAddress = process.env.REAL_VERIFIER_ADDRESS || '0xb6fc7c8130c09d12939a2f5b1b31a24c859bd310'
  const rvAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'abi', 'RealVerifier.json'), 'utf8'))

  // Read VK
  const vk = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'zk', 'build', 'verification_key_final.json'), 'utf8'))

  const toBig = (s) => BigInt(s)

  const alpha1 = { X: toBig(vk.vk_alpha_1[0]), Y: toBig(vk.vk_alpha_1[1]) }
  const beta2 = {
    X: [toBig(vk.vk_beta_2[0][1]), toBig(vk.vk_beta_2[0][0])],
    Y: [toBig(vk.vk_beta_2[1][1]), toBig(vk.vk_beta_2[1][0])],
  }
  const gamma2 = {
    X: [toBig(vk.vk_gamma_2[0][1]), toBig(vk.vk_gamma_2[0][0])],
    Y: [toBig(vk.vk_gamma_2[1][1]), toBig(vk.vk_gamma_2[1][0])],
  }
  const delta2 = {
    X: [toBig(vk.vk_delta_2[0][1]), toBig(vk.vk_delta_2[0][0])],
    Y: [toBig(vk.vk_delta_2[1][1]), toBig(vk.vk_delta_2[1][0])],
  }
  const IC = vk.IC.map((pt) => ({ X: toBig(pt[0]), Y: toBig(pt[1]) }))

  console.log('Setting VK on RealVerifier at', rvAddress)
  console.log('  alpha1:', alpha1.X.toString().slice(0, 20) + '...')
  console.log('  IC length:', IC.length)

  const { request } = await publicClient.simulateContract({
    address: rvAddress,
    abi: rvAbi,
    functionName: 'setVerificationKey',
    args: [alpha1, beta2, gamma2, delta2, IC],
    account,
  })
  const hash = await walletClient.writeContract(request)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log('setVerificationKey tx:', receipt.transactionHash)
  console.log('VK set successfully!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
