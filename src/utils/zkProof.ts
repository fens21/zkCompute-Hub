export interface ZKProofResult {
  a: [bigint, bigint]
  b: [[bigint, bigint], [bigint, bigint]]
  c: [bigint, bigint]
  input: bigint[]
  commitHash: string
}

export async function generateZKProof(jobId: number): Promise<ZKProofResult> {
  const preimage = generateRandomBigInt()
  const { buildPoseidon } = await import('circomlibjs')
  const poseidon = await buildPoseidon()
  const hash = poseidon([BigInt(jobId), preimage])
  const commitHash = poseidon.F.toString(hash)

  const wasmPath = '/zk/job_proof.wasm'
  const zkeyPath = '/zk/job_proof_final.zkey'
  const snarkjs = await import('snarkjs')
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { jobId: String(jobId), commitHash, preimage: preimage.toString() },
    wasmPath,
    zkeyPath,
  )

  const a: [bigint, bigint] = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])]
  const b: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(proof.pi_b[0][0]), BigInt(proof.pi_b[0][1])],
    [BigInt(proof.pi_b[1][0]), BigInt(proof.pi_b[1][1])],
  ]
  const c: [bigint, bigint] = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])]
  const input: bigint[] = publicSignals.map((s: string) => BigInt(s))

  return { a, b, c, input, commitHash }
}

function generateRandomBigInt(): bigint {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let result = 0n
  for (let i = 0; i < 32; i++) {
    result = (result << 8n) + BigInt(bytes[i])
  }
  return result
}
