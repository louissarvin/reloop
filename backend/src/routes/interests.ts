import { Hono } from 'hono';
import { sql } from '../services/database';
import { sendBuyerInterestEmail } from '../services/email';
import type { Interest, CreateInterestInput, SellerPreferences, InterestStats } from '../types/interest';

export const interestRoutes = new Hono();

// Encryption key must match frontend
const ENCRYPTION_KEY = 'reloop-contact-2024';

/**
 * Decrypt seller's phone number
 */
function decryptPhone(encrypted: string): string {
  if (!encrypted) return '';
  try {
    const decoded = Buffer.from(encrypted, 'base64').toString('binary');
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

// Create new interest
interestRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateInterestInput>();

    // Validate required fields
    if (!body.tokenId || !body.sellerAddress) {
      return c.json({ success: false, error: 'Missing tokenId or sellerAddress' }, 400);
    }

    if (!body.buyerEmail && !body.buyerPhone) {
      return c.json({ success: false, error: 'Either email or phone is required' }, 400);
    }

    // Generate unique ID
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();

    // Insert interest
    await sql`
      INSERT INTO interests (id, token_id, seller_address, buyer_email, buyer_phone, buyer_address, message, created_at)
      VALUES (${id}, ${body.tokenId}, ${body.sellerAddress.toLowerCase()}, ${body.buyerEmail || null}, ${body.buyerPhone || null}, ${body.buyerAddress?.toLowerCase() || null}, ${body.message || null}, ${createdAt})
    `;

    // Send email to BUYER with seller's contact info
    let notificationSent = false;

    if (body.buyerEmail) {
      // Decrypt seller's phone if available
      const sellerPhone = body.encryptedSellerPhone
        ? decryptPhone(body.encryptedSellerPhone)
        : undefined;

      const result = await sendBuyerInterestEmail({
        buyerEmail: body.buyerEmail,
        tokenId: body.tokenId,
        tokenName: body.tokenName || `Token #${body.tokenId}`,
        sellerPhone,
        assetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/asset/${body.tokenId}`,
      });

      notificationSent = result.success;

      // Update notification status
      if (notificationSent) {
        await sql`UPDATE interests SET notification_sent = 1 WHERE id = ${id}`;
      }
    }

    return c.json({
      success: true,
      interest: { id, tokenId: body.tokenId, createdAt },
      notificationSent,
    });
  } catch (error) {
    console.error('Error creating interest:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Get interests for a seller (all their tokens)
interestRoutes.get('/seller/:address', async (c) => {
  try {
    const address = c.req.param('address').toLowerCase();

    const interests = await sql<Interest[]>`
      SELECT * FROM interests
      WHERE seller_address = ${address}
      ORDER BY created_at DESC
    `;

    return c.json({ success: true, interests });
  } catch (error) {
    console.error('Error fetching seller interests:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Get interests for a specific token
interestRoutes.get('/token/:tokenId', async (c) => {
  try {
    const tokenId = c.req.param('tokenId');

    const interests = await sql<Interest[]>`
      SELECT * FROM interests
      WHERE token_id = ${tokenId}
      ORDER BY created_at DESC
    `;

    return c.json({ success: true, interests });
  } catch (error) {
    console.error('Error fetching token interests:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Get interest count stats for seller
interestRoutes.get('/stats/:address', async (c) => {
  try {
    const address = c.req.param('address').toLowerCase();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const result = await sql<InterestStats[]>`
      SELECT
        COUNT(*)::int as total,
        COUNT(CASE WHEN created_at > ${oneDayAgo} THEN 1 END)::int as last24h
      FROM interests
      WHERE seller_address = ${address}
    `;

    return c.json({ success: true, stats: result[0] || { total: 0, last24h: 0 } });
  } catch (error) {
    console.error('Error fetching interest stats:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Update seller email preferences
interestRoutes.post('/preferences', async (c) => {
  try {
    const { address, notificationEmail, emailNotificationsEnabled } = await c.req.json();

    if (!address) {
      return c.json({ success: false, error: 'Address required' }, 400);
    }

    await sql`
      INSERT INTO seller_preferences (address, notification_email, email_notifications_enabled, updated_at)
      VALUES (${address.toLowerCase()}, ${notificationEmail || null}, ${emailNotificationsEnabled !== false ? 1 : 0}, ${Date.now()})
      ON CONFLICT(address) DO UPDATE SET
        notification_email = EXCLUDED.notification_email,
        email_notifications_enabled = EXCLUDED.email_notifications_enabled,
        updated_at = EXCLUDED.updated_at
    `;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Get seller preferences
interestRoutes.get('/preferences/:address', async (c) => {
  try {
    const address = c.req.param('address').toLowerCase();

    const result = await sql<SellerPreferences[]>`
      SELECT * FROM seller_preferences WHERE address = ${address}
    `;

    return c.json({ success: true, preferences: result[0] || null });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});
