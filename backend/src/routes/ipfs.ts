import { Hono } from "hono";
import { uploadImage, uploadMetadata, uploadNFT, type NFTMetadata } from "../services/pinata";

export const ipfsRoutes = new Hono();

/**
 * POST /api/ipfs/upload-image
 * Upload a single image to IPFS
 */
ipfsRoutes.post("/upload-image", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" }, 400);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ success: false, error: "File too large. Max size: 10MB" }, 400);
    }

    const result = await uploadImage(file);
    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error("Error in upload-image:", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

/**
 * POST /api/ipfs/upload-metadata
 * Upload NFT metadata JSON to IPFS
 */
ipfsRoutes.post("/upload-metadata", async (c) => {
  try {
    const metadata = await c.req.json<NFTMetadata>();

    // Validate required fields
    if (!metadata.name || !metadata.description || !metadata.image) {
      return c.json(
        { success: false, error: "Missing required fields: name, description, image" },
        400
      );
    }

    const result = await uploadMetadata(metadata);
    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error("Error in upload-metadata:", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

/**
 * POST /api/ipfs/upload-nft
 * Upload image and metadata together
 * Form data: file (image), name, description, attributes (JSON string)
 */
ipfsRoutes.post("/upload-nft", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    const name = body.name as string;
    const description = body.description as string;
    const attributesRaw = body.attributes as string;

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    if (!name || !description) {
      return c.json({ success: false, error: "Missing required fields: name, description" }, 400);
    }

    // Parse attributes
    let attributes: Array<{ trait_type: string; value: string | number }> = [];
    if (attributesRaw) {
      try {
        attributes = JSON.parse(attributesRaw);
      } catch {
        return c.json({ success: false, error: "Invalid attributes JSON" }, 400);
      }
    }

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, error: "Invalid file type" }, 400);
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ success: false, error: "File too large. Max: 10MB" }, 400);
    }

    const result = await uploadNFT(file, { name, description, attributes });
    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error("Error in upload-nft:", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

/**
 * GET /api/ipfs/health
 * Check IPFS service health
 */
ipfsRoutes.get("/health", async (c) => {
  const hasPinataJwt = !!process.env.PINATA_JWT;
  return c.json({
    status: hasPinataJwt ? "ready" : "missing_config",
    pinataConfigured: hasPinataJwt,
  });
});
