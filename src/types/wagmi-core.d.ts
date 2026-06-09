declare module "@wagmi/core" {
  import { Config } from "wagmi";
  export function readContract(config: Config, args: any): Promise<any>;
  export function waitForTransactionReceipt(config: Config, args: any): Promise<{ status: string }>;
}
