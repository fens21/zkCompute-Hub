const { createPublicClient, http } = require('viem')
const litforge = {
  id: 4441, name: 'LitForge Testnet',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
}
const c = createPublicClient({ chain: litforge, transport: http() })
const oldAddr = '0x47080b4eECD6f686b5a2c9A3C90847c568aC1330'

const jobAbi = [{ inputs: [{ type: 'uint256' }], name: 'jobs', outputs: [
  { name:'id', type:'uint256' }, { name:'title', type:'string' }, { name:'jobType', type:'string' },
  { name:'reward', type:'uint256' }, { name:'token', type:'address' }, { name:'poster', type:'address' },
  { name:'maxWorkers', type:'uint256' }, { name:'claimedCount', type:'uint256' },
  { name:'active', type:'bool' }, { name:'deadline', type:'uint256' },
], stateMutability:'view', type:'function' }]

async function main() {
  let totalNative = 0, totalUsdc = 0
  for (let i = 1; i <= 7; i++) {
    const j = await c.readContract({ address: oldAddr, abi: jobAbi, functionName: 'jobs', args: [BigInt(i)] })
    const isNative = j[4] === '0x0000000000000000000000000000000000000000'
    const reward = Number(j[3])
    const max = Number(j[6])
    const claimed = Number(j[7])
    const leftover = max - claimed
    const stuckVal = reward * leftover
    const divisor = isNative ? 1e18 : 1e6
    const unit = isNative ? 'zkLTC' : 'USDC'
    console.log('Job ' + i + ' | max=' + max + ' claimed=' + claimed + ' leftover=' + leftover +
      ' | reward=' + (reward / divisor).toFixed(isNative?4:2) + ' ' + unit +
      ' | stuck=' + (stuckVal / divisor).toFixed(isNative?4:2) + ' ' + unit)
    if (isNative) totalNative += stuckVal; else totalUsdc += stuckVal
  }
  console.log('\nTotal stuck: ' + (totalNative / 1e18).toFixed(4) + ' zkLTC + ' + (totalUsdc / 1e6).toFixed(2) + ' USDC')
}
main()
