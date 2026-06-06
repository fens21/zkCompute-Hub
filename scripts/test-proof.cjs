const snarkjs = require('snarkjs')
const { buildPoseidon } = require('circomlibjs')
const { createPublicClient, http } = require('viem')
const path = require('path')
const fs = require('fs')

async function main() {
  const zk = path.join(__dirname, '..', 'zk', 'build')
  const jobId = '1', secret = '42'

  const poseidon = await buildPoseidon()
  const commitHash = poseidon.F.toString(poseidon([BigInt(jobId), BigInt(secret)]))
  console.log('commitHash:', commitHash)

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { jobId, preimage: secret, commitHash },
    path.join(zk, 'job_proof_js', 'job_proof.wasm'),
    path.join(zk, 'job_proof_final.zkey')
  )
  console.log('publicSignals:', publicSignals)

  const vk = JSON.parse(fs.readFileSync(path.join(zk, 'verification_key_final.json'), 'utf8'))
  const localOk = await snarkjs.groth16.verify(vk, publicSignals, proof)
  console.log('Local verify:', localOk)

  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals)
  const groups = []; let depth = 0; let start = 0
  for (let i = 0; i < calldata.length; i++) {
    if (calldata[i] === '[') { depth++; if (depth === 1) start = i }
    if (calldata[i] === ']') { depth--; if (depth === 0) groups.push(calldata.slice(start, i+1)) }
  }
  const [aArr, bArr, cArr, inputArr] = groups.map(x => JSON.parse(x))

  // Save proof
  const out = { a: aArr, b: bArr, c: cArr, input: inputArr, publicSignals, commitHash }
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'zk', 'sample-proof.json'), JSON.stringify(out, null, 2))
  console.log('Proof saved')

  // On-chain verification
  const litforge = { id: 4441, name: 'LitForge Testnet', nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 }, rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } } }
  const client = createPublicClient({ chain: litforge, transport: http() })
  const rv = process.env.REAL_VERIFIER_ADDRESS
  const rvAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'abi', 'RealVerifier.json'), 'utf8'))

  try {
    const onChain = await client.readContract({ address: rv, abi: rvAbi, functionName: 'verifyProof', args: [aArr, bArr, cArr, inputArr] })
    console.log('On-chain verifyProof:', onChain)
  } catch(e) {
    console.log('On-chain FAILED:', e.reason || 'no reason')
    console.log('shortMessage:', e.shortMessage?.slice(0, 200))
  }
}
main().catch(console.error)
