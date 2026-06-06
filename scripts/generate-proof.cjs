const snarkjs = require('snarkjs')
const { buildPoseidon } = require('circomlibjs')
const path = require('path')
const fs = require('fs')

async function main() {
  const zk = path.join(__dirname, '..', 'zk', 'build')

  const jobId = process.argv[2] || '1'
  const secret = process.argv[3] || '42'

  const poseidon = await buildPoseidon()
  const commitHash = poseidon.F.toString(poseidon([BigInt(jobId), BigInt(secret)]))
  console.log('jobId:', jobId)
  console.log('secret:', secret)
  console.log('commitHash:', commitHash)

  const input = { jobId, preimage: secret, commitHash }

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    path.join(zk, 'job_proof_js', 'job_proof.wasm'),
    path.join(zk, 'job_proof_final.zkey')
  )
  console.log('Proof public signals:', publicSignals)

  const proofCalldata = await snarkjs.groth16.exportSolidityCallData(
    proof,
    publicSignals
  )
  console.log('Solidity calldata:', proofCalldata)

  // Format: [a_x,a_y],[[b_x1,b_x2],[b_y1,b_y2]],[c_x,c_y],[i1,i2]
  // Find matching bracket groups
  function parseGroups(str) {
    const groups = []
    let depth = 0
    let start = 0
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '[') { depth++; if (depth === 1) start = i }
      if (str[i] === ']') { depth--; if (depth === 0) groups.push(str.slice(start, i+1)) }
    }
    return groups
  }
  const g = parseGroups(proofCalldata)
  const a = JSON.parse(g[0])
  const b = JSON.parse(g[1])
  const c = JSON.parse(g[2])
  const inputArr = JSON.parse(g[3])

  const result = { a, b, c, input: inputArr, publicSignals, commitHash }
  const outPath = path.join(__dirname, '..', 'public', 'zk', 'sample-proof.json')
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log('\nSample proof saved to ' + outPath)
  console.log('a:', JSON.stringify(a))
  console.log('b:', JSON.stringify(b))
  console.log('c:', JSON.stringify(c))
  console.log('input:', JSON.stringify(inputArr))
}

main().catch(console.error)
