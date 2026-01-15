import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = process.env.INTERESTS_DB_PATH || path.join(dataDir, 'interests.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS interests (
    id TEXT PRIMARY KEY,
    token_id TEXT NOT NULL,
    seller_address TEXT NOT NULL,
    buyer_email TEXT,
    buyer_phone TEXT,
    buyer_address TEXT,
    message TEXT,
    created_at INTEGER NOT NULL,
    notification_sent INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS seller_preferences (
    address TEXT PRIMARY KEY,
    notification_email TEXT,
    email_notifications_enabled INTEGER DEFAULT 1,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_interests_seller ON interests(seller_address);
  CREATE INDEX IF NOT EXISTS idx_interests_token ON interests(token_id);
  CREATE INDEX IF NOT EXISTS idx_interests_created ON interests(created_at);
`);

console.log('SQLite database initialized at:', dbPath);

export { db };
