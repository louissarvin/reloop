const PONDER_API_URL = import.meta.env.VITE_PONDER_URL || 'http://localhost:42069';

// Types based on ponder.schema.ts
export interface Token {
  id: string;
  tokenId: string;
  minter: string;
  owner: string;
  tokenUri: string | null;
  depth: number;
  profitSplitsBps: string; // JSON array
  mintedAt: string;
  mintTxHash: string;
}

export interface Listing {
  id: string;
  tokenId: string;
  seller: string;
  price: string;
  active: boolean;
  listedAt: string;
  txHash: string;
}

export interface Sale {
  id: string;
  tokenId: string;
  seller: string;
  buyer: string;
  price: string;
  profit: string;
  timestamp: string;
  txHash: string;
  blockNumber: string;
}

export interface OwnerHistory {
  id: string;
  tokenId: string;
  owner: string;
  purchasePrice: string;
  timestamp: string;
  txHash: string;
}

export interface ProfitDistribution {
  id: string;
  tokenId: string;
  saleId: string | null;
  recipient: string;
  amount: string;
  generation: number;
  timestamp: string;
  txHash: string;
}

export interface UserStats {
  id: string;
  tokensMinted: number;
  tokensBought: number;
  tokensSold: number;
  totalSpent: string;
  totalEarned: string;
  profitReceived: string;
}

export interface MarketplaceStats {
  totalTokens: number;
  totalSales: number;
  activeListings: number;
  totalVolume: string;
  totalProfitDistributed: string;
}

// API Response types
export interface PaginatedResponse {
  limit: number;
  offset: number;
}

export interface TokensResponse extends PaginatedResponse {
  tokens: Token[];
}

export interface ListingsResponse extends PaginatedResponse {
  listings: Listing[];
}

export interface SalesResponse extends PaginatedResponse {
  sales: Sale[];
}

export interface TokenDetailResponse {
  token: Token;
  ownerHistory: OwnerHistory[];
  listing: Listing | null;
  sales: Sale[];
}

export interface UserProfileResponse {
  stats: UserStats;
  ownedTokens: Token[];
  mintedTokens: Token[];
  recentProfits: ProfitDistribution[];
}

export interface TokenProfitsResponse {
  profits: ProfitDistribution[];
}

// API Functions

/**
 * Fetch all tokens with pagination
 */
export async function fetchTokens(limit = 20, offset = 0): Promise<TokensResponse> {
  const response = await fetch(`${PONDER_API_URL}/tokens?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error('Failed to fetch tokens');
  return response.json();
}

/**
 * Fetch single token with full details
 */
export async function fetchTokenDetail(tokenId: string): Promise<TokenDetailResponse> {
  const response = await fetch(`${PONDER_API_URL}/tokens/${tokenId}`);
  if (!response.ok) throw new Error('Failed to fetch token detail');
  return response.json();
}

/**
 * Fetch active marketplace listings
 */
export async function fetchListings(limit = 20, offset = 0): Promise<ListingsResponse> {
  const response = await fetch(`${PONDER_API_URL}/listings?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error('Failed to fetch listings');
  return response.json();
}

/**
 * Fetch recent sales
 */
export async function fetchSales(limit = 20, offset = 0): Promise<SalesResponse> {
  const response = await fetch(`${PONDER_API_URL}/sales?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error('Failed to fetch sales');
  return response.json();
}

/**
 * Fetch user profile with owned tokens and stats
 */
export async function fetchUserProfile(address: string): Promise<UserProfileResponse> {
  const response = await fetch(`${PONDER_API_URL}/users/${address.toLowerCase()}`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

/**
 * Fetch profit distribution history for a token
 */
export async function fetchTokenProfits(tokenId: string): Promise<TokenProfitsResponse> {
  const response = await fetch(`${PONDER_API_URL}/tokens/${tokenId}/profits`);
  if (!response.ok) throw new Error('Failed to fetch token profits');
  return response.json();
}

/**
 * Fetch marketplace stats
 */
export async function fetchMarketplaceStats(): Promise<MarketplaceStats> {
  const response = await fetch(`${PONDER_API_URL}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

/**
 * Parse token URI and fetch metadata
 */
export async function fetchTokenMetadata(tokenUri: string | null): Promise<{
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
} | null> {
  if (!tokenUri) return null;

  try {
    // Handle IPFS URIs
    let url = tokenUri;
    if (tokenUri.startsWith('ipfs://')) {
      const hash = tokenUri.replace('ipfs://', '');
      url = `https://gateway.pinata.cloud/ipfs/${hash}`;
    }

    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Format IPFS image URL for display
 */
export function formatIpfsUrl(uri: string | null | undefined): string {
  if (!uri) return '/placeholder-car.png';

  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  return uri;
}

/**
 * Format price from wei/smallest unit to readable format
 */
export function formatPrice(price: string | bigint, decimals = 6): string {
  const value = typeof price === 'string' ? BigInt(price) : price;
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fractionStr}`;
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
