import { ponder } from "@/generated";
import {
  token,
  listing,
  sale,
  ownerHistory,
  profitDistribution,
  platformFee,
  userStats,
} from "../../ponder.schema";

// Helper to get or create user stats
async function getOrCreateUserStats(db: any, address: `0x${string}`) {
  const existing = await db.find(userStats, { id: address });
  if (existing) return existing;

  await db.insert(userStats).values({
    id: address,
    tokensMinted: 0,
    tokensBought: 0,
    tokensSold: 0,
    totalSpent: 0n,
    totalEarned: 0n,
    profitReceived: 0n,
  });

  return await db.find(userStats, { id: address });
}

// ============ ReLoopRWA Events ============

// Handle token minting
ponder.on("ReLoopRWA:TokenMinted", async ({ event, context }) => {
  const { tokenId, minter, depth, profitSplitsBps } = event.args;

  // Get token URI from contract
  let tokenUri: string | null = null;
  try {
    tokenUri = await context.client.readContract({
      address: event.log.address,
      abi: [
        {
          type: "function",
          name: "tokenURI",
          inputs: [{ name: "tokenId", type: "uint256" }],
          outputs: [{ name: "", type: "string" }],
          stateMutability: "view",
        },
      ],
      functionName: "tokenURI",
      args: [tokenId],
    });
  } catch (e) {
    console.error("Error fetching tokenURI:", e);
  }

  // Create token record (lowercase addresses for consistent querying)
  await context.db.insert(token).values({
    id: tokenId.toString(),
    tokenId,
    minter: minter.toLowerCase() as `0x${string}`,
    owner: minter.toLowerCase() as `0x${string}`,
    tokenUri,
    depth: Number(depth),
    profitSplitsBps: JSON.stringify(profitSplitsBps.map(Number)),
    mintedAt: event.block.timestamp,
    mintTxHash: event.transaction.hash,
  });

  // Create initial owner history entry
  const minterLower = minter.toLowerCase() as `0x${string}`;
  await context.db.insert(ownerHistory).values({
    id: `${tokenId}-0`,
    tokenId,
    owner: minterLower,
    purchasePrice: 0n, // Minting has no purchase price
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update user stats
  const stats = await getOrCreateUserStats(context.db, minterLower);
  await context.db
    .update(userStats, { id: minterLower })
    .set({ tokensMinted: stats.tokensMinted + 1 });
});

// Handle token transfers
ponder.on("ReLoopRWA:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;

  // Skip mint transfers (from = 0x0)
  if (from === "0x0000000000000000000000000000000000000000") {
    return;
  }

  // Update token owner (lowercase for consistent querying)
  await context.db.update(token, { id: tokenId.toString() }).set({
    owner: to.toLowerCase() as `0x${string}`
  });
});

// Handle owner history updates (from marketplace sales)
ponder.on("ReLoopRWA:OwnerHistoryUpdated", async ({ event, context }) => {
  const { tokenId, newOwner, purchasePrice } = event.args;

  // Use transaction hash and log index for unique ID (no need to count)
  await context.db.insert(ownerHistory).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    tokenId,
    owner: newOwner.toLowerCase() as `0x${string}`,
    purchasePrice,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});

// ============ ReLoopMarketplace Events ============

// Handle listing creation
ponder.on("ReLoopMarketplace:Listed", async ({ event, context }) => {
  const { tokenId, seller, price } = event.args;
  const sellerLower = seller.toLowerCase() as `0x${string}`;

  // Upsert listing (update if exists, create if not)
  await context.db
    .insert(listing)
    .values({
      id: tokenId.toString(),
      tokenId,
      seller: sellerLower,
      price,
      active: true,
      listedAt: event.block.timestamp,
      txHash: event.transaction.hash,
    })
    .onConflictDoUpdate({
      seller: sellerLower,
      price,
      active: true,
      listedAt: event.block.timestamp,
      txHash: event.transaction.hash,
    });
});

// Handle delisting
ponder.on("ReLoopMarketplace:Delisted", async ({ event, context }) => {
  const { tokenId } = event.args;

  await context.db.update(listing, { id: tokenId.toString() }).set({ active: false });
});

// Handle sales
ponder.on("ReLoopMarketplace:Sale", async ({ event, context }) => {
  const { tokenId, seller, buyer, price, profit } = event.args;
  const sellerLower = seller.toLowerCase() as `0x${string}`;
  const buyerLower = buyer.toLowerCase() as `0x${string}`;

  const saleId = `${event.transaction.hash}-${event.log.logIndex}`;

  // Create sale record
  await context.db.insert(sale).values({
    id: saleId,
    tokenId,
    seller: sellerLower,
    buyer: buyerLower,
    price,
    profit,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
  });

  // Deactivate listing
  await context.db.update(listing, { id: tokenId.toString() }).set({ active: false });

  // Update seller stats
  const sellerStats = await getOrCreateUserStats(context.db, sellerLower);
  await context.db.update(userStats, { id: sellerLower }).set({
    tokensSold: sellerStats.tokensSold + 1,
    totalEarned: sellerStats.totalEarned + (price - profit),
  });

  // Update buyer stats
  const buyerStats = await getOrCreateUserStats(context.db, buyerLower);
  await context.db.update(userStats, { id: buyerLower }).set({
    tokensBought: buyerStats.tokensBought + 1,
    totalSpent: buyerStats.totalSpent + price,
  });
});

// Handle profit distribution (cascade payments)
ponder.on("ReLoopMarketplace:ProfitDistributed", async ({ event, context }) => {
  const { tokenId, recipient, amount, generation } = event.args;
  const recipientLower = recipient.toLowerCase() as `0x${string}`;

  await context.db.insert(profitDistribution).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    tokenId,
    saleId: null, // Will be linked if we can find the sale
    recipient: recipientLower,
    amount,
    generation: Number(generation),
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update recipient stats
  const stats = await getOrCreateUserStats(context.db, recipientLower);
  await context.db.update(userStats, { id: recipientLower }).set({
    profitReceived: stats.profitReceived + amount,
  });
});

// Handle platform fee collection
ponder.on("ReLoopMarketplace:PlatformFeeCollected", async ({ event, context }) => {
  const { tokenId, amount } = event.args;

  await context.db.insert(platformFee).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    tokenId,
    amount,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});
