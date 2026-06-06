pragma circom 2.1.9;

include "../circomlib/poseidon.circom";

template JobProof() {
    signal input jobId;
    signal input commitHash;
    signal input preimage;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== jobId;
    poseidon.inputs[1] <== preimage;

    commitHash === poseidon.out;
}

component main { public [jobId, commitHash] } = JobProof();
