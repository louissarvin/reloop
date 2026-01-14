export interface ProfitSplit {
  recipient: string; // "Gen 1 (Seller)", "Gen 2", etc.
  percentage: number;
  amount: number;
}

export interface Token {
  id: string;
  name: string;
  image: string;
  description: string;
  depth: number; // 0-5
  splits: number[]; // e.g. [6, 4, 2]
  history: HistoryEvent[];
}

export interface Listing {
  tokenId: string;
  seller: string;
  price: number;
  active: boolean;
  token: Token; // Hydrated token data
}

export interface HistoryEvent {
  date: string;
  type: 'MINT' | 'LIST' | 'SALE' | 'PROFIT';
  from?: string;
  to?: string;
  price?: number;
  amount?: number; // For profit events
}

export interface User {
  address: string;
  balance: number; // USDC
  inventory: string[]; // Token IDs
  earnings: number;
}
