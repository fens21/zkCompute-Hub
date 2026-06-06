import type { JobTypeConfig } from '../types'

export const JOB_TYPE_CONFIGS: Record<string, JobTypeConfig> = {
  ML: {
    label: 'Machine Learning',
    color: '#38bdf8',
    fields: [
      { key: 'modelArchitecture', label: 'Model Architecture', type: 'text', placeholder: 'e.g. ResNet-50, Llama-2-7B', required: true },
      { key: 'framework', label: 'Framework', type: 'select', options: [{ value: 'pytorch', label: 'PyTorch' }, { value: 'tensorflow', label: 'TensorFlow' }, { value: 'jax', label: 'JAX' }, { value: 'onnx', label: 'ONNX' }], required: true },
      { key: 'epochs', label: 'Epochs', type: 'number', placeholder: '100', required: true },
      { key: 'batchSize', label: 'Batch Size', type: 'number', placeholder: '32' },
      { key: 'learningRate', label: 'Learning Rate', type: 'text', placeholder: '0.001' },
      { key: 'precision', label: 'Precision', type: 'select', options: [{ value: 'fp32', label: 'FP32' }, { value: 'fp16', label: 'FP16' }, { value: 'int8', label: 'INT8' }] },
      { key: 'numGPUs', label: 'Number of GPUs', type: 'number', placeholder: '1' },
    ],
    inputHint: 'Dataset URL or model checkpoint',
    inputPlaceholder: 'https://... or ipfs://...',
    outputHint: 'Expected accuracy / loss threshold, model weights format',
    verificationOptions: [
      { value: 'hash-check', label: 'Weight Hash (off-chain)' },
      { value: 'manual-review', label: 'Manual Review' },
    ],
  },
  ZK: {
    label: 'Zero Knowledge Proof',
    color: '#a78bfa',
    fields: [
      { key: 'circuitType', label: 'Circuit Type', type: 'select', options: [{ value: 'groth16', label: 'Groth16' }, { value: 'plonk', label: 'PLONK' }, { value: 'stark', label: 'STARK' }], required: true },
      { key: 'curve', label: 'Curve', type: 'select', options: [{ value: 'bn254', label: 'BN254' }, { value: 'bls12-381', label: 'BLS12-381' }] },
      { key: 'constraintCount', label: 'Constraint Count (approx)', type: 'text', placeholder: '100000' },
      { key: 'publicInputs', label: 'Public Inputs Count', type: 'number', placeholder: '2' },
    ],
    inputHint: 'Witness file, input.json, circuit WASM',
    inputPlaceholder: 'Paste input JSON or upload file',
    outputHint: 'proof.json + public.json structure',
    verificationOptions: [
      { value: 'zk-proof', label: 'On-chain ZK Proof' },
      { value: 'hash-check', label: 'Hash Check (off-chain)' },
    ],
  },
  Render: {
    label: 'Video / 3D Render',
    color: '#f97316',
    fields: [
      { key: 'engine', label: 'Render Engine', type: 'select', options: [{ value: 'blender', label: 'Blender' }, { value: 'maya', label: 'Maya' }, { value: 'unreal', label: 'Unreal Engine' }], required: true },
      { key: 'samples', label: 'Samples', type: 'number', placeholder: '256' },
      { key: 'resolution', label: 'Resolution', type: 'select', options: [{ value: '1920x1080', label: '1920x1080' }, { value: '3840x2160', label: '4K' }, { value: '1280x720', label: '720p' }], required: true },
      { key: 'outputFormat', label: 'Output Format', type: 'select', options: [{ value: 'png', label: 'PNG' }, { value: 'exr', label: 'EXR' }, { value: 'jpg', label: 'JPEG' }] },
      { key: 'frameRange', label: 'Frame Range', type: 'text', placeholder: '1-240' },
    ],
    inputHint: 'Blend/Maya/USD file, textures',
    inputPlaceholder: 'Upload .blend file or paste URL',
    outputHint: 'Rendered frames format, resolution, quality threshold',
    verificationOptions: [
      { value: 'hash-check', label: 'Frame Hash Check' },
      { value: 'manual-review', label: 'Manual Visual Review' },
    ],
  },
  'AI Inference': {
    label: 'AI Inference',
    color: '#34d399',
    fields: [
      { key: 'modelId', label: 'Model ID / HuggingFace', type: 'text', placeholder: 'meta-llama/Llama-2-7b', required: true },
      { key: 'batchSize', label: 'Batch Size', type: 'number', placeholder: '1' },
      { key: 'precision', label: 'Precision', type: 'select', options: [{ value: 'fp32', label: 'FP32' }, { value: 'fp16', label: 'FP16' }, { value: 'int8', label: 'INT8' }] },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', placeholder: '1024' },
      { key: 'temperature', label: 'Temperature', type: 'text', placeholder: '0.7' },
    ],
    inputHint: 'Prompt text, input image, or tensor',
    inputPlaceholder: 'Paste input prompt or JSON',
    outputHint: 'Output format, max latency, min throughput',
    verificationOptions: [
      { value: 'zk-proof', label: 'ZK Proof (zkML)' },
      { value: 'hash-check', label: 'Output Hash Check' },
    ],
  },
  'AI Training': {
    label: 'AI Training',
    color: '#4ade80',
    fields: [
      { key: 'modelArchitecture', label: 'Model Architecture', type: 'text', placeholder: 'Llama-2-7B, YOLOv8', required: true },
      { key: 'framework', label: 'Framework', type: 'select', options: [{ value: 'pytorch', label: 'PyTorch' }, { value: 'tensorflow', label: 'TensorFlow' }, { value: 'jax', label: 'JAX' }], required: true },
      { key: 'epochs', label: 'Epochs', type: 'number', placeholder: '50', required: true },
      { key: 'batchSize', label: 'Batch Size', type: 'number', placeholder: '64' },
      { key: 'learningRate', label: 'Learning Rate', type: 'text', placeholder: '1e-4' },
      { key: 'precision', label: 'Precision', type: 'select', options: [{ value: 'fp32', label: 'FP32' }, { value: 'fp16', label: 'FP16' }, { value: 'bf16', label: 'BF16' }] },
      { key: 'numGPUs', label: 'Number of GPUs', type: 'number', placeholder: '4' },
      { key: 'datasetSize', label: 'Dataset Size', type: 'text', placeholder: 'e.g. 100GB, 1M samples' },
    ],
    inputHint: 'Dataset URL, base model checkpoint',
    inputPlaceholder: 'https://... or ipfs://...',
    outputHint: 'Target accuracy/loss, model weights format',
    verificationOptions: [
      { value: 'hash-check', label: 'Weight Hash (off-chain)' },
      { value: 'manual-review', label: 'Manual Review' },
    ],
  },
  'Data Labeling': {
    label: 'Data Labeling',
    color: '#fbbf24',
    fields: [
      { key: 'taskType', label: 'Task Type', type: 'select', options: [{ value: 'classification', label: 'Classification' }, { value: 'bbox', label: 'Bounding Box' }, { value: 'segmentation', label: 'Segmentation' }, { value: 'ner', label: 'Named Entity Recognition' }], required: true },
      { key: 'labelSchema', label: 'Label Schema', type: 'text', placeholder: 'cat, dog, bird (comma separated)', required: true },
      { key: 'minAnnotations', label: 'Min Annotations per Item', type: 'number', placeholder: '1' },
    ],
    inputHint: 'Dataset (images/text/audio), label taxonomy file',
    inputPlaceholder: 'Upload dataset or paste URL',
    outputHint: 'Annotated dataset format (COCO/JSON/CSV), agreement threshold',
    verificationOptions: [
      { value: 'manual-review', label: 'Manual Sampling Review' },
      { value: 'hash-check', label: 'Dataset Hash Check' },
    ],
  },
  'Video Transcoding': {
    label: 'Video Transcoding',
    color: '#fb7185',
    fields: [
      { key: 'codec', label: 'Codec', type: 'select', options: [{ value: 'h264', label: 'H.264' }, { value: 'h265', label: 'H.265/HEVC' }, { value: 'vp9', label: 'VP9' }, { value: 'av1', label: 'AV1' }], required: true },
      { key: 'crf', label: 'CRF', type: 'number', placeholder: '23' },
      { key: 'preset', label: 'Preset', type: 'select', options: [{ value: 'fast', label: 'Fast' }, { value: 'medium', label: 'Medium' }, { value: 'slow', label: 'Slow' }] },
      { key: 'resolution', label: 'Output Resolution', type: 'text', placeholder: '1920x1080' },
      { key: 'bitrate', label: 'Bitrate', type: 'text', placeholder: '5M' },
      { key: 'audioCodec', label: 'Audio Codec', type: 'select', options: [{ value: 'aac', label: 'AAC' }, { value: 'mp3', label: 'MP3' }, { value: 'opus', label: 'Opus' }] },
    ],
    inputHint: 'Source video URL or file',
    inputPlaceholder: 'Upload video or paste URL',
    outputHint: 'Output format specs, SSIM/PSNR threshold',
    verificationOptions: [
      { value: 'hash-check', label: 'Perceptual Hash (SSIM)' },
      { value: 'manual-review', label: 'Manual Spot Check' },
    ],
  },
  Scientific: {
    label: 'Scientific Simulation',
    color: '#67e8f9',
    fields: [
      { key: 'engine', label: 'Simulation Engine', type: 'select', options: [{ value: 'gromacs', label: 'GROMACS' }, { value: 'namd', label: 'NAMD' }, { value: 'alphafold2', label: 'AlphaFold2' }, { value: 'rosetta', label: 'Rosetta' }], required: true },
      { key: 'forceField', label: 'Force Field', type: 'text', placeholder: 'AMBER99SB-ILDN' },
      { key: 'simulationSteps', label: 'Simulation Steps', type: 'number', placeholder: '1000000', required: true },
      { key: 'temperatureRange', label: 'Temperature Range (K)', type: 'text', placeholder: '300-350' },
      { key: 'ensemble', label: 'Ensemble', type: 'select', options: [{ value: 'nvt', label: 'NVT' }, { value: 'npt', label: 'NPT' }, { value: 'nve', label: 'NVE' }] },
    ],
    inputHint: 'PDB file, topology, or sequence (FASTA)',
    inputPlaceholder: 'Upload .pdb / .top file or paste sequence',
    outputHint: 'Energy threshold (kcal/mol), RMSD, trajectory format',
    verificationOptions: [
      { value: 'hash-check', label: 'Energy Comparison (off-chain)' },
      { value: 'manual-review', label: 'Scientific Review' },
    ],
  },
  'RAG Pipeline': {
    label: 'RAG Pipeline',
    color: '#c084fc',
    fields: [
      { key: 'chunkStrategy', label: 'Chunk Strategy', type: 'select', options: [{ value: 'recursive', label: 'Recursive' }, { value: 'semantic', label: 'Semantic' }, { value: 'fixed', label: 'Fixed Size' }], required: true },
      { key: 'chunkSize', label: 'Chunk Size', type: 'number', placeholder: '512' },
      { key: 'chunkOverlap', label: 'Chunk Overlap', type: 'number', placeholder: '128' },
      { key: 'embeddingModel', label: 'Embedding Model', type: 'text', placeholder: 'text-embedding-3-small', required: true },
      { key: 'topK', label: 'Top K Retrieval', type: 'number', placeholder: '5' },
    ],
    inputHint: 'Documents (PDF/HTML/markdown), query examples',
    inputPlaceholder: 'Upload documents or paste URL',
    outputHint: 'Index size, retrieval latency, recall@K threshold',
    verificationOptions: [
      { value: 'hash-check', label: 'Index Hash Check' },
      { value: 'manual-review', label: 'Query Golden Set Evaluation' },
    ],
  },
  FHE: {
    label: 'FHE Computation',
    color: '#f472b6',
    fields: [
      { key: 'scheme', label: 'FHE Scheme', type: 'select', options: [{ value: 'bfv', label: 'BFV' }, { value: 'bgv', label: 'BGV' }, { value: 'ckks', label: 'CKKS' }], required: true },
      { key: 'polyDegree', label: 'Polynomial Degree', type: 'number', placeholder: '4096', required: true },
      { key: 'plainModulus', label: 'Plain Modulus', type: 'text', placeholder: '65537' },
      { key: 'scaleModulus', label: 'Scale Modulus', type: 'text', placeholder: '1e6' },
      { key: 'multiplicationDepth', label: 'Multiplication Depth', type: 'number', placeholder: '4' },
      { key: 'securityLevel', label: 'Security Level', type: 'select', options: [{ value: '128', label: '128-bit' }, { value: '192', label: '192-bit' }, { value: '256', label: '256-bit' }] },
    ],
    inputHint: 'Ciphertext or public key to process',
    inputPlaceholder: 'Paste ciphertext (hex) or upload file',
    outputHint: 'Ciphertext result, minimum noise budget threshold',
    verificationOptions: [
      { value: 'zk-proof', label: 'Decryption ZK Proof' },
      { value: 'hash-check', label: 'Noise Budget Check' },
    ],
  },
  Custom: {
    label: 'Custom',
    color: '#a855f7',
    fields: [],
    inputHint: 'Describe what input is needed',
    inputPlaceholder: 'Input specification...',
    outputHint: 'Describe expected output format',
    verificationOptions: [
      { value: 'manual-review', label: 'Manual Review' },
      { value: 'hash-check', label: 'Hash Check' },
    ],
  },
}

// Additional suggested job types that fit the verifiable compute model.
// These can be added to expand beyond pure "computation".
// Each should support one of the existing verificationOptions (hash-check, manual-review, zk-proof).

export const SUGGESTED_ADDITIONAL_TYPES = {
  'Audio Processing': {
    label: 'Audio / Speech Processing',
    color: '#f43f5e',
    fields: [
      { key: 'task', label: 'Task', type: 'select', options: [
        { value: 'stt', label: 'Speech-to-Text' }, 
        { value: 'tts', label: 'Text-to-Speech' }, 
        { value: 'enhancement', label: 'Audio Enhancement' },
        { value: 'diarization', label: 'Speaker Diarization' }
      ], required: true },
      { key: 'model', label: 'Model / Engine', type: 'text', placeholder: 'whisper-large, coqui-tts' },
      { key: 'sampleRate', label: 'Sample Rate', type: 'number', placeholder: '16000' },
      { key: 'language', label: 'Language', type: 'text', placeholder: 'en, id, multi' },
    ],
    inputHint: 'Audio file URL (wav/mp3) or transcript',
    inputPlaceholder: 'https://... or ipfs://...',
    outputHint: 'Transcript JSON, audio file hash, WER/CER threshold',
    verificationOptions: [
      { value: 'hash-check', label: 'Output Hash + WER Check' },
      { value: 'manual-review', label: 'Manual Transcript Review' },
      { value: 'zk-proof', label: 'ZK Proof of Correct Transcription (advanced)' },
    ],
  },

  'Image Generation': {
    label: 'Image / Vision Generation',
    color: '#a78bfa',
    fields: [
      { key: 'model', label: 'Model', type: 'text', placeholder: 'stable-diffusion-xl, flux', required: true },
      { key: 'resolution', label: 'Resolution', type: 'select', options: [{ value: '512x512', label: '512x512' }, { value: '1024x1024', label: '1024x1024' }, { value: '1024x576', label: '16:9' }], required: true },
      { key: 'steps', label: 'Inference Steps', type: 'number', placeholder: '30' },
      { key: 'guidanceScale', label: 'Guidance Scale', type: 'text', placeholder: '7.5' },
      { key: 'seed', label: 'Seed (optional for reproducibility)', type: 'text' },
    ],
    inputHint: 'Text prompt + optional reference image / mask',
    inputPlaceholder: 'A cyberpunk city at night...',
    outputHint: 'Generated image hash, CLIP score, or perceptual similarity threshold',
    verificationOptions: [
      { value: 'hash-check', label: 'Image Hash + Perceptual Hash' },
      { value: 'manual-review', label: 'Manual Quality Review' },
    ],
  },

  'Smart Contract Audit': {
    label: 'Smart Contract Audit & Formal Verification',
    color: '#f97316',
    fields: [
      { key: 'language', label: 'Language', type: 'select', options: [{ value: 'solidity', label: 'Solidity' }, { value: 'vyper', label: 'Vyper' }, { value: 'move', label: 'Move' }], required: true },
      { key: 'toolchain', label: 'Tools Used', type: 'text', placeholder: 'Slither, Mythril, Certora, Foundry' },
      { key: 'contractSize', label: 'Contract Size (LOC or bytecode)', type: 'text' },
      { key: 'focusAreas', label: 'Focus Areas', type: 'text', placeholder: 'Reentrancy, access control, math' },
    ],
    inputHint: 'Source code (Solidity) + test suite or deployment address',
    inputPlaceholder: 'Paste contract code or GitHub link',
    outputHint: 'Audit report hash, vulnerability count, formal proof artifacts',
    verificationOptions: [
      { value: 'manual-review', label: 'Auditor Report Review' },
      { value: 'hash-check', label: 'Report + Bytecode Hash' },
    ],
  },

  'Data Anonymization': {
    label: 'Data Anonymization & Privacy',
    color: '#14b8a6',
    fields: [
      { key: 'technique', label: 'Technique', type: 'select', options: [
        { value: 'k-anonymity', label: 'k-Anonymity' },
        { value: 'differential-privacy', label: 'Differential Privacy' },
        { value: 'synthetic', label: 'Synthetic Data Generation' },
        { value: 'federated', label: 'Federated Anonymization' }
      ], required: true },
      { key: 'epsilon', label: 'Privacy Budget (ε)', type: 'text', placeholder: '1.0' },
      { key: 'kValue', label: 'k Value (for k-anonymity)', type: 'number', placeholder: '5' },
    ],
    inputHint: 'Raw dataset (CSV/Parquet) + schema',
    inputPlaceholder: 'Upload or link to dataset',
    outputHint: 'Anonymized dataset hash, privacy metrics (epsilon, k, utility loss)',
    verificationOptions: [
      { value: 'hash-check', label: 'Dataset Hash + Privacy Metrics' },
      { value: 'manual-review', label: 'Sample Review + Metric Validation' },
    ],
  },

  'LLM Evaluation': {
    label: 'LLM Evaluation & Benchmarking',
    color: '#eab308',
    fields: [
      { key: 'benchmark', label: 'Benchmark Suite', type: 'select', options: [
        { value: 'mmlu', label: 'MMLU' }, 
        { value: 'humaneval', label: 'HumanEval' }, 
        { value: 'gsm8k', label: 'GSM8K' },
        { value: 'custom', label: 'Custom Eval Set' }
      ], required: true },
      { key: 'modelVersion', label: 'Model Version', type: 'text', placeholder: 'gpt-4o, llama-3-70b' },
      { key: 'numSamples', label: 'Number of Samples', type: 'number', placeholder: '1000' },
      { key: 'metrics', label: 'Metrics', type: 'text', placeholder: 'accuracy, pass@k, bleu' },
    ],
    inputHint: 'Evaluation dataset + model endpoint or weights',
    inputPlaceholder: 'Dataset URL or HuggingFace dataset',
    outputHint: 'Score report, benchmark hash, statistical significance',
    verificationOptions: [
      { value: 'hash-check', label: 'Eval Set Hash + Score Verification' },
      { value: 'manual-review', label: 'Human Evaluation Sampling' },
    ],
  },
}

export const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPE_CONFIGS).map(([value, config]) => ({
  value,
  label: config.label,
}))

// Helper to get all available types (core + suggested)
export const ALL_JOB_TYPES = {
  ...JOB_TYPE_CONFIGS,
  ...SUGGESTED_ADDITIONAL_TYPES,
}
