import { ponder } from "@/generated";
import { eq, desc } from "@ponder/core";
import {
  token,
  listing,
  sale,
  ownerHistory,
  profitDistribution,
  userStats,
} from "../../../ponder.schema";

// Get all tokens with pagination
ponder.get("/tokens", async (c) => {
  const limit = Number(c.req.query("limit") || 20);
  const offset = Number(c.req.query("offset") || 0);

  const tokens = await c.db
    .select()
    .from(token)
    .orderBy(desc(token.mintedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ tokens, limit, offset });
});

// Get single token by ID
ponder.get("/tokens/:id", async (c) => {
  const tokenId = c.req.param("id");

  const tokenData = await c.db.find(token, { id: tokenId });

  if (!tokenData) {
    return c.json({ error: "Token not found" }, 404);
  }

  // Get owner history
  const history = await c.db
    .select()
    .from(ownerHistory)
    .where(eq(ownerHistory.tokenId, BigInt(tokenId)))
    .orderBy(desc(ownerHistory.timestamp));

  // Get current listing if active
  const currentListing = await c.db.find(listing, { id: tokenId });

  // Get sales history
  const sales = await c.db
    .select()
    .from(sale)
    .where(eq(sale.tokenId, BigInt(tokenId)))
    .orderBy(desc(sale.timestamp));

  return c.json({
    token: tokenData,
    ownerHistory: history,
    listing: currentListing?.active ? currentListing : null,
    sales,
  });
});

// Get active listings
ponder.get("/listings", async (c) => {
  const limit = Number(c.req.query("limit") || 20);
  const offset = Number(c.req.query("offset") || 0);

  const listings = await c.db
    .select()
    .from(listing)
    .where(eq(listing.active, true))
    .orderBy(desc(listing.listedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ listings, limit, offset });
});

// Get recent sales
ponder.get("/sales", async (c) => {
  const limit = Number(c.req.query("limit") || 20);
  const offset = Number(c.req.query("offset") || 0);

  const sales = await c.db
    .select()
    .from(sale)
    .orderBy(desc(sale.timestamp))
    .limit(limit)
    .offset(offset);

  return c.json({ sales, limit, offset });
});

// Get user stats and activity
ponder.get("/users/:address", async (c) => {
  const address = c.req.param("address").toLowerCase() as `0x${string}`;

  const stats = await c.db.find(userStats, { id: address });

  // Get tokens owned by user
  const ownedTokens = await c.db
    .select()
    .from(token)
    .where(eq(token.owner, address));

  // Get tokens minted by user
  const mintedTokens = await c.db
    .select()
    .from(token)
    .where(eq(token.minter, address));

  // Get profit distributions received
  const profits = await c.db
    .select()
    .from(profitDistribution)
    .where(eq(profitDistribution.recipient, address))
    .orderBy(desc(profitDistribution.timestamp))
    .limit(50);

  return c.json({
    stats: stats || {
      id: address,
      tokensMinted: 0,
      tokensBought: 0,
      tokensSold: 0,
      totalSpent: "0",
      totalEarned: "0",
      profitReceived: "0",
    },
    ownedTokens,
    mintedTokens,
    recentProfits: profits,
  });
});

// Get profit cascade history for a token
ponder.get("/tokens/:id/profits", async (c) => {
  const tokenId = c.req.param("id");

  const profits = await c.db
    .select()
    .from(profitDistribution)
    .where(eq(profitDistribution.tokenId, BigInt(tokenId)))
    .orderBy(desc(profitDistribution.timestamp));

  return c.json({ profits });
});

// Get marketplace stats
ponder.get("/stats", async (c) => {
  const totalTokens = await c.db.select().from(token);
  const totalSales = await c.db.select().from(sale);
  const activeListings = await c.db
    .select()
    .from(listing)
    .where(eq(listing.active, true));

  // Calculate totals
  const totalVolume = totalSales.reduce((acc, s) => acc + s.price, 0n);
  const totalProfit = totalSales.reduce((acc, s) => acc + s.profit, 0n);

  return c.json({
    totalTokens: totalTokens.length,
    totalSales: totalSales.length,
    activeListings: activeListings.length,
    totalVolume: totalVolume.toString(),
    totalProfitDistributed: totalProfit.toString(),
  });
});
