import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ReLoopMarketplaceABI, ReLoopRWAABI, MockUSDCABI } from "./abis";
import {
  getReLoopMarketplaceAddress,
  getReLoopRWAAddress,
  getMockUSDCAddress,
  MANTLE_SEPOLIA_CHAIN_ID,
} from "./addresses";

// ============ MockUSDC Hooks ============

export function useUSDCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: getMockUSDCAddress(),
    abi: MockUSDCABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });
}

export function useUSDCAllowance(owner: `0x${string}` | undefined, spender: `0x${string}`) {
  return useReadContract({
    address: getMockUSDCAddress(),
    abi: MockUSDCABI,
    functionName: "allowance",
    args: owner ? [owner, spender] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!owner,
    },
  });
}

export function useUSDCApprove() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: getMockUSDCAddress(),
      abi: MockUSDCABI,
      functionName: "approve",
      args: [spender, amount],
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useUSDCAirdrop() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimAirdrop = () => {
    writeContract({
      address: getMockUSDCAddress(),
      abi: MockUSDCABI,
      functionName: "airdrop",
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { claimAirdrop, hash, isPending, isConfirming, isSuccess, error };
}

// ============ ReLoopRWA Hooks ============

export function useTokenConfig(tokenId: bigint | undefined) {
  return useReadContract({
    address: getReLoopRWAAddress(),
    abi: ReLoopRWAABI,
    functionName: "getTokenConfig",
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

export function useOwnerHistory(tokenId: bigint | undefined) {
  return useReadContract({
    address: getReLoopRWAAddress(),
    abi: ReLoopRWAABI,
    functionName: "getOwnerHistory",
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

export function useTokenOwner(tokenId: bigint | undefined) {
  return useReadContract({
    address: getReLoopRWAAddress(),
    abi: ReLoopRWAABI,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

export function useTokenURI(tokenId: bigint | undefined) {
  return useReadContract({
    address: getReLoopRWAAddress(),
    abi: ReLoopRWAABI,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

export function useNextTokenId() {
  return useReadContract({
    address: getReLoopRWAAddress(),
    abi: ReLoopRWAABI,
    functionName: "nextTokenId",
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
  });
}

export function useMaxSplitForDepth(depth: number) {
  return useReadContract({
    address: getReLoopRWAAddress(),
    abi: ReLoopRWAABI,
    functionName: "getMaxSplitForDepth",
    args: [depth],
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
  });
}

export function useMintToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mint = (to: `0x${string}`, uri: string, depth: number, profitSplitsBps: number[]) => {
    writeContract({
      address: getReLoopRWAAddress(),
      abi: ReLoopRWAABI,
      functionName: "mint",
      args: [to, uri, depth, profitSplitsBps],
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { mint, hash, isPending, isConfirming, isSuccess, error };
}

export function useApproveNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (to: `0x${string}`, tokenId: bigint) => {
    writeContract({
      address: getReLoopRWAAddress(),
      abi: ReLoopRWAABI,
      functionName: "approve",
      args: [to, tokenId],
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useSetApprovalForAll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setApprovalForAll = (operator: `0x${string}`, approved: boolean) => {
    writeContract({
      address: getReLoopRWAAddress(),
      abi: ReLoopRWAABI,
      functionName: "setApprovalForAll",
      args: [operator, approved],
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { setApprovalForAll, hash, isPending, isConfirming, isSuccess, error };
}

// ============ ReLoopMarketplace Hooks ============

export function useListing(tokenId: bigint | undefined) {
  return useReadContract({
    address: getReLoopMarketplaceAddress(),
    abi: ReLoopMarketplaceABI,
    functionName: "getListing",
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

export function useCalculateDistribution(tokenId: bigint | undefined, salePrice: bigint | undefined) {
  return useReadContract({
    address: getReLoopMarketplaceAddress(),
    abi: ReLoopMarketplaceABI,
    functionName: "calculateDistribution",
    args: tokenId !== undefined && salePrice !== undefined ? [tokenId, salePrice] : undefined,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: tokenId !== undefined && salePrice !== undefined,
    },
  });
}

export function useListToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const list = (tokenId: bigint, price: bigint) => {
    writeContract({
      address: getReLoopMarketplaceAddress(),
      abi: ReLoopMarketplaceABI,
      functionName: "list",
      args: [tokenId, price],
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { list, hash, isPending, isConfirming, isSuccess, error };
}

export function useDelistToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const delist = (tokenId: bigint) => {
    writeContract({
      address: getReLoopMarketplaceAddress(),
      abi: ReLoopMarketplaceABI,
      functionName: "delist",
      args: [tokenId],
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { delist, hash, isPending, isConfirming, isSuccess, error };
}

export function useBuyToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buy = (tokenId: bigint) => {
    writeContract({
      address: getReLoopMarketplaceAddress(),
      abi: ReLoopMarketplaceABI,
      functionName: "buy",
      args: [tokenId],
      chainId: MANTLE_SEPOLIA_CHAIN_ID,
    });
  };

  return { buy, hash, isPending, isConfirming, isSuccess, error };
}
