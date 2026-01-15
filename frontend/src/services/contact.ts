/**
 * Simple encryption/decryption for phone numbers
 * In production, use a proper encryption service with server-side keys
 */

const ENCRYPTION_KEY = 'reloop-contact-2024'; // In production, use env variable

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
 * Interest record for a listing
 */
export interface Interest {
  id: string;
  tokenId: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  message?: string;
  createdAt: number;
}

const STORAGE_KEY = 'reloop-interests';

/**
 * Get all interests from storage
 */
export function getInterests(): Interest[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get interests for a specific token
 */
export function getInterestsForToken(tokenId: string): Interest[] {
  return getInterests().filter(i => i.tokenId === tokenId);
}

/**
 * Get interests made by a specific wallet address
 */
export function getInterestsByBuyer(buyerAddress: string): Interest[] {
  return getInterests().filter(
    i => i.buyerAddress?.toLowerCase() === buyerAddress.toLowerCase()
  );
}

/**
 * Add a new interest
 */
export function addInterest(interest: Omit<Interest, 'id' | 'createdAt'>): Interest {
  const newInterest: Interest = {
    ...interest,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };

  const interests = getInterests();
  interests.push(newInterest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(interests));

  return newInterest;
}

/**
 * Check if buyer already showed interest in a token
 */
export function hasShownInterest(tokenId: string, buyerAddress?: string, buyerEmail?: string): boolean {
  const interests = getInterestsForToken(tokenId);
  return interests.some(
    i =>
      (buyerAddress && i.buyerAddress?.toLowerCase() === buyerAddress.toLowerCase()) ||
      (buyerEmail && i.buyerEmail?.toLowerCase() === buyerEmail.toLowerCase())
  );
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
