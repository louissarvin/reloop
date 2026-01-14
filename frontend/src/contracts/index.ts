// ABIs
export { ReLoopMarketplaceABI, ReLoopRWAABI, MockUSDCABI } from "./abis";

// Hooks
export {
  // USDC
  useUSDCBalance,
  useUSDCAllowance,
  useUSDCApprove,
  useUSDCAirdrop,
  // RWA Token
  useTokenConfig,
  useOwnerHistory,
  useTokenOwner,
  useTokenURI,
  useNextTokenId,
  useMaxSplitForDepth,
  useMintToken,
  useApproveNFT,
  useSetApprovalForAll,
  // Marketplace
  useListing,
  useCalculateDistribution,
  useListToken,
  useDelistToken,
  useBuyToken,
} from "./hooks";

// Addresses
export {
  CONTRACT_ADDRESSES,
  MANTLE_SEPOLIA_CHAIN_ID,
  DEFAULT_CHAIN_ID,
  getContractAddresses,
  getMockUSDCAddress,
  getReLoopRWAAddress,
  getReLoopMarketplaceAddress,
} from "./addresses";

// Chain configuration for wagmi
export const mantleSepolia = {
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.sepolia.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MantleScan",
      url: "https://sepolia.mantlescan.xyz",
    },
  },
  testnet: true,
} as const;

// USDC decimals constant
export const USDC_DECIMALS = 6;

// Helper to format USDC amounts
export function formatUSDC(amount: bigint): string {
  const value = Number(amount) / 10 ** USDC_DECIMALS;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Helper to parse USDC amounts
export function parseUSDC(amount: string | number): bigint {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.round(value * 10 ** USDC_DECIMALS));
}
