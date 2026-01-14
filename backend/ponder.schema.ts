import { onchainTable, relations, index } from "@ponder/core";

// Token table - stores all minted NFTs
export const token = onchainTable("token", (t) => ({
  id: t.text().primaryKey(), // tokenId as string
  tokenId: t.bigint().notNull(),
  minter: t.hex().notNull(),
  owner: t.hex().notNull(),
  tokenUri: t.text(),
  depth: t.integer().notNull(),
  profitSplitsBps: t.text().notNull(), // JSON array of uint16[]
  mintedAt: t.bigint().notNull(),
  mintTxHash: t.hex().notNull(),
}));

export const tokenRelations = relations(token, ({ many }) => ({
  listings: many(listing),
  sales: many(sale),
  ownerHistory: many(ownerHistory),
  profitDistributions: many(profitDistribution),
}));

// Listing table - active marketplace listings
export const listing = onchainTable("listing", (t) => ({
  id: t.text().primaryKey(), // tokenId as string
  tokenId: t.bigint().notNull(),
  seller: t.hex().notNull(),
  price: t.bigint().notNull(),
  active: t.boolean().notNull(),
  listedAt: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const listingRelations = relations(listing, ({ one }) => ({
  token: one(token, { fields: [listing.id], references: [token.id] }),
}));

// Sale table - completed sales
export const sale = onchainTable("sale", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  tokenId: t.bigint().notNull(),
  seller: t.hex().notNull(),
  buyer: t.hex().notNull(),
  price: t.bigint().notNull(),
  profit: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}));

export const saleRelations = relations(sale, ({ one, many }) => ({
  token: one(token, { fields: [sale.tokenId], references: [token.tokenId] }),
  profitDistributions: many(profitDistribution),
}));

// Owner history - tracks all ownership changes
export const ownerHistory = onchainTable("owner_history", (t) => ({
  id: t.text().primaryKey(), // tokenId-index
  tokenId: t.bigint().notNull(),
  owner: t.hex().notNull(),
  purchasePrice: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const ownerHistoryRelations = relations(ownerHistory, ({ one }) => ({
  token: one(token, { fields: [ownerHistory.tokenId], references: [token.tokenId] }),
}));

// Profit distribution - tracks cascade payments
export const profitDistribution = onchainTable("profit_distribution", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  tokenId: t.bigint().notNull(),
  saleId: t.text(), // Reference to the sale
  recipient: t.hex().notNull(),
  amount: t.bigint().notNull(),
  generation: t.integer().notNull(), // 0 = first previous owner, 1 = second, etc.
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const profitDistributionRelations = relations(profitDistribution, ({ one }) => ({
  token: one(token, { fields: [profitDistribution.tokenId], references: [token.tokenId] }),
  sale: one(sale, { fields: [profitDistribution.saleId], references: [sale.id] }),
}));

// Platform fee collection
export const platformFee = onchainTable("platform_fee", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  tokenId: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

// User stats - aggregated user data
export const userStats = onchainTable("user_stats", (t) => ({
  id: t.hex().primaryKey(), // user address
  tokensMinted: t.integer().notNull().default(0),
  tokensBought: t.integer().notNull().default(0),
  tokensSold: t.integer().notNull().default(0),
  totalSpent: t.bigint().notNull(),
  totalEarned: t.bigint().notNull(),
  profitReceived: t.bigint().notNull(), // from cascade payments
}));
