#!/usr/bin/env node
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

const args = process.argv.slice(2)
const input = args[0] || 'default'

function toProof(input) {
  let data = input
  if (input.startsWith('@')) {
    // support file input: @hasil-render.mp4
    try {
      data = readFileSync(input.slice(1)).toString('hex').slice(0, 200)
    } catch {
      data = input
    }
  }
  const hash = createHash('sha256').update(data + 'zkproof').digest('hex')
  return '0x' + hash.slice(0, 16) + createHash('sha256').update(hash).digest('hex').slice(0, 48)
}

const proof = toProof(input)
console.log('\n✅ Proof generated from input')
console.log('Proof:', proof)
console.log('\nPaste this into the dApp modal.\n')