/**
 * Contact and Interest Service
 * Handles buyer interests and seller contact information
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Simple encryption/decryption for phone numbers
 * In production, use a proper encryption service with server-side keys
 */
const ENCRYPTION_KEY = 'reloop-contact-2024';

/**
 * Simple XOR-based encryption with base64 encoding
 */
export function encryptPhone(phone: string): string {
  if (!phone) return '';

  let encrypted = '';
  for (let i = 0; i < phone.length; i++) {
    encrypted += String.fromCharCode(
      phone.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return btoa(encrypted);
}

/**
 * Decrypt phone number
 */
export function decryptPhone(encrypted: string): string {
  if (!encrypted) return '';

  try {
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return decrypted;
  } catch {
    return '';
  }
}

/**
 * Interest record from backend
 */
export interface Interest {
  id: string;
  token_id: string;
  seller_address: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_address?: string;
  message?: string;
  created_at: number;
  notification_sent?: number;
}

/**
 * Input for creating an interest
 */
export interface CreateInterestInput {
  tokenId: string;
  sellerAddress: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  message?: string;
  encryptedSellerPhone?: string; // Pass encrypted phone for email
  tokenName?: string; // Token name for email
}

/**
 * Interest statistics
 */
export interface InterestStats {
  total: number;
  last24h: number;
}

/**
 * Seller notification preferences
 */
export interface SellerPreferences {
  notification_email?: string;
  email_notifications_enabled: boolean;
}

/**
 * Create a new interest (calls backend API)
 */
export async function addInterest(input: CreateInterestInput): Promise<{
  success: boolean;
  interest?: { id: string; tokenId: string; createdAt: number };
  notificationSent?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding interest:', error);
    return { success: false, error: 'Failed to submit interest' };
  }
}

/**
 * Get all interests for a seller's tokens
 */
export async function getInterestsBySeller(sellerAddress: string): Promise<Interest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interests/seller/${sellerAddress}`);
    const data = await response.json();
    return data.success ? data.interests : [];
  } catch (error) {
    console.error('Error fetching seller interests:', error);
    return [];
  }
}

/**
 * Get interests for a specific token
 */
export async function getInterestsForToken(tokenId: string): Promise<Interest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interests/token/${tokenId}`);
    const data = await response.json();
    return data.success ? data.interests : [];
  } catch (error) {
    console.error('Error fetching token interests:', error);
    return [];
  }
}

/**
 * Get interest stats for a seller
 */
export async function getInterestStats(sellerAddress: string): Promise<InterestStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interests/stats/${sellerAddress}`);
    const data = await response.json();
    return data.success ? data.stats : { total: 0, last24h: 0 };
  } catch (error) {
    console.error('Error fetching interest stats:', error);
    return { total: 0, last24h: 0 };
  }
}

/**
 * Update seller email preferences
 */
export async function updateSellerPreferences(
  address: string,
  notificationEmail?: string,
  emailNotificationsEnabled?: boolean
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interests/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, notificationEmail, emailNotificationsEnabled }),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error updating preferences:', error);
    return false;
  }
}

/**
 * Get seller preferences
 */
export async function getSellerPreferences(address: string): Promise<SellerPreferences | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interests/preferences/${address}`);
    const data = await response.json();
    return data.success ? data.preferences : null;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }
}

/**
 * Format phone for display (mask middle digits)
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-2);
  return `${start}${'*'.repeat(phone.length - 5)}${end}`;
}
