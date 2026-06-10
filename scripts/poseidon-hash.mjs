import { buildPoseidon } from 'circomlibjs';

// Compute Poseidon(jobId, solution) — untuk generate expectedOutput
async function main() {
  const jobId = BigInt(process.argv[2] || '1');
  const solution = BigInt(process.argv[3] || '12345');

  const poseidon = await buildPoseidon();
  const hash = poseidon.F.toString(poseidon([jobId, solution]));

  console.log('=== ZK Test Helper ===');
  console.log(`jobId:      ${jobId.toString()}`);
  console.log(`solution:   ${solution.toString()}`);
  console.log(`expectedOutput (Poseidon hash): ${hash}`);
  console.log('');
  console.log('Post job dengan expectedOutput di atas, lalu submit proof dengan solution.');
}

main().catch(console.error);
