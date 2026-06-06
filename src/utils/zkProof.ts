export interface ZKProofResult {
  a: [bigint, bigint]
  b: [[bigint, bigint], [bigint, bigint]]
  c: [bigint, bigint]
  input: bigint[]
  // For the new circuit we expose the public expectedOutput (was previously called commitHash)
  expectedOutput: string
  // The solution the user entered (for logging / activity record, not sent on-chain)
  solution: string
}

export interface GenerateZKProofParams {
  jobId: number
  // The solution the worker "computed" or discovered for this job (private input)
  solution: string | bigint
  // The target hash the poster set for this job (public input).
  // Should be the Poseidon(jobId, correctSolution) value, usually stored in job.expectedOutput
  expectedOutput: string | bigint
}

/**
 * Generate a ZK proof that the caller knows `solution` such that:
 *   Poseidon(jobId, solution) === expectedOutput
 *
 * This is the "verifiable compute" proof: the worker proves they found the
 * correct solution for the job without revealing the solution on-chain.
 */
export async function generateZKProof(params: GenerateZKProofParams): Promise<ZKProofResult> {
  const { jobId, solution, expectedOutput } = params

  const jobIdBig = BigInt(jobId)
  const solutionBig = typeof solution === 'bigint' ? solution : BigInt(solution)
  const expectedBig = typeof expectedOutput === 'bigint' ? expectedOutput : BigInt(expectedOutput)

  const wasmPath = '/zk/job_proof.wasm'
  const zkeyPath = '/zk/job_proof_final.zkey'
  const snarkjs = await import('snarkjs')

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      jobId: jobIdBig.toString(),
      expectedOutput: expectedBig.toString(),
      solution: solutionBig.toString(),
    },
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

  return {
    a,
    b,
    c,
    input,
    expectedOutput: expectedBig.toString(),
    solution: solutionBig.toString(),
  }
}
