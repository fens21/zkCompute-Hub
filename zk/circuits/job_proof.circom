pragma circom 2.1.9;

include "../circomlib/poseidon.circom";

// JobProof: Proves knowledge of a secret `solution` for a specific job
// such that Poseidon(jobId, solution) === expectedOutput
//
// This turns the ZK proof into a verifiable "I computed / found the correct solution"
// for the job, without revealing the solution on-chain.
//
// - jobId: public (binds the proof to this job)
// - expectedOutput: public (the target hash set by the job poster in job metadata)
// - solution: private (the answer the worker discovered by performing the compute work)
//
// For real use, the poster sets expectedOutput = Poseidon(jobId, correctSolution).
// The worker runs the required compute / puzzle off-chain to discover the solution,
// then uses this ZK proof to claim payment trustlessly.
template JobProof() {
    signal input jobId;
    signal input expectedOutput;  // public: target Poseidon hash (set via job.expectedOutput)
    signal input solution;        // private: the secret solution / computed result

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== jobId;
    poseidon.inputs[1] <== solution;

    expectedOutput === poseidon.out;
}

component main { public [jobId, expectedOutput] } = JobProof();
