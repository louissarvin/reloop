export interface Interest {
  id: string;
  token_id: string;
  seller_address: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_address?: string;
  message?: string;
  created_at: number;
  notification_sent: number;
}

export interface CreateInterestInput {
  tokenId: string;
  sellerAddress: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  message?: string;
  encryptedSellerPhone?: string; // Encrypted phone from NFT metadata
  tokenName?: string; // Token name for email
}

export interface SellerPreferences {
  address: string;
  notification_email?: string;
  email_notifications_enabled: number;
  updated_at: number;
}

export interface InterestStats {
  total: number;
  last24h: number;
}
