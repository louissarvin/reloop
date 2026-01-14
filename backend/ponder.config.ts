import { createConfig } from "@ponder/core";
import { http } from "viem";

import ReLoopRWAAbi from "./abis/ReLoopRWA.json";
import ReLoopMarketplaceAbi from "./abis/ReLoopMarketplace.json";

// Mantle Sepolia contract addresses
const RELOOP_RWA_ADDRESS = "0xaA4886d00e3A22aB6f4b5105CC782B1C29c3d910";
const RELOOP_MARKETPLACE_ADDRESS = "0x003f586c9Dc9de4FeE29c49E437230258cb4cA9E";

// Contract deployment block
const START_BLOCK = 33427584;

export default createConfig({
  networks: {
    mantleSepolia: {
      chainId: 5003,
      transport: http("https://rpc.sepolia.mantle.xyz"),
    },
  },
  contracts: {
    ReLoopRWA: {
      network: "mantleSepolia",
      abi: ReLoopRWAAbi,
      address: RELOOP_RWA_ADDRESS,
      startBlock: START_BLOCK,
    },
    ReLoopMarketplace: {
      network: "mantleSepolia",
      abi: ReLoopMarketplaceAbi,
      address: RELOOP_MARKETPLACE_ADDRESS,
      startBlock: START_BLOCK,
    },
  },
});
