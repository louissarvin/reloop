// Contract addresses for Mantle Sepolia (Chain ID: 5003)
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

export const CONTRACT_ADDRESSES = {
  [MANTLE_SEPOLIA_CHAIN_ID]: {
    MockUSDC: "0x72698EF7eDB40709520C92F84024E6556481EA15" as const,
    ReLoopRWA: "0xaA4886d00e3A22aB6f4b5105CC782B1C29c3d910" as const,
    ReLoopMarketplace: "0x003f586c9Dc9de4FeE29c49E437230258cb4cA9E" as const,
  },
} as const;

// Default to Mantle Sepolia for development
export const DEFAULT_CHAIN_ID = MANTLE_SEPOLIA_CHAIN_ID;

// Helper function to get addresses for current chain
export function getContractAddresses(chainId: number = DEFAULT_CHAIN_ID) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`No contract addresses configured for chain ID: ${chainId}`);
  }
  return addresses;
}

// Individual address getters
export function getMockUSDCAddress(chainId: number = DEFAULT_CHAIN_ID) {
  return getContractAddresses(chainId).MockUSDC;
}

export function getReLoopRWAAddress(chainId: number = DEFAULT_CHAIN_ID) {
  return getContractAddresses(chainId).ReLoopRWA;
}

export function getReLoopMarketplaceAddress(chainId: number = DEFAULT_CHAIN_ID) {
  return getContractAddresses(chainId).ReLoopMarketplace;
}
