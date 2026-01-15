import postgres from 'postgres';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/reloop';

const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Initialize tables
async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS interests (
        id TEXT PRIMARY KEY,
        token_id TEXT NOT NULL,
        seller_address TEXT NOT NULL,
        buyer_email TEXT,
        buyer_phone TEXT,
        buyer_address TEXT,
        message TEXT,
        created_at BIGINT NOT NULL,
        notification_sent INTEGER DEFAULT 0
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS seller_preferences (
        address TEXT PRIMARY KEY,
        notification_email TEXT,
        email_notifications_enabled INTEGER DEFAULT 1,
        updated_at BIGINT NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_interests_seller ON interests(seller_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interests_token ON interests(token_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interests_created ON interests(created_at)`;

    console.log('PostgreSQL database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Initialize on import
initDatabase().catch(console.error);

export { sql };
