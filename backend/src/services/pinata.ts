import { PinataSDK } from "pinata-web3";

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

export interface UploadImageResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

export interface UploadMetadataResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  tokenUri?: string;
  error?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export async function uploadImage(file: File): Promise<UploadImageResult> {
  try {
    const upload = await pinata.upload.file(file);
    const ipfsUrl = `ipfs://${upload.IpfsHash}`;
    const gatewayUrl = `https://${process.env.PINATA_GATEWAY || "gateway.pinata.cloud"}/ipfs/${upload.IpfsHash}`;

    return {
      success: true,
      ipfsHash: upload.IpfsHash,
      ipfsUrl: gatewayUrl,
    };
  } catch (error) {
    console.error("Error uploading image to IPFS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Upload NFT metadata JSON to IPFS via Pinata
 */
export async function uploadMetadata(metadata: NFTMetadata): Promise<UploadMetadataResult> {
  try {
    const upload = await pinata.upload.json(metadata);
    const tokenUri = `ipfs://${upload.IpfsHash}`;
    const gatewayUrl = `https://${process.env.PINATA_GATEWAY || "gateway.pinata.cloud"}/ipfs/${upload.IpfsHash}`;

    return {
      success: true,
      ipfsHash: upload.IpfsHash,
      ipfsUrl: gatewayUrl,
      tokenUri,
    };
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Upload both image and metadata in one call
 */
export async function uploadNFT(
  imageFile: File,
  metadata: Omit<NFTMetadata, "image">
): Promise<{
  success: boolean;
  imageUrl?: string;
  tokenUri?: string;
  error?: string;
}> {
  // First upload the image
  const imageResult = await uploadImage(imageFile);
  if (!imageResult.success) {
    return { success: false, error: imageResult.error };
  }

  // Then upload metadata with the image URL
  const fullMetadata: NFTMetadata = {
    ...metadata,
    image: `ipfs://${imageResult.ipfsHash}`,
  };

  const metadataResult = await uploadMetadata(fullMetadata);
  if (!metadataResult.success) {
    return { success: false, error: metadataResult.error };
  }

  return {
    success: true,
    imageUrl: imageResult.ipfsUrl,
    tokenUri: metadataResult.tokenUri,
  };
}

export { pinata };
