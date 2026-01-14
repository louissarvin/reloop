const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface UploadImageResponse {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

export interface UploadMetadataResponse {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  tokenUri?: string;
  error?: string;
}

export interface UploadNFTResponse {
  success: boolean;
  imageUrl?: string;
  tokenUri?: string;
  error?: string;
}

/**
 * Upload an image file to IPFS
 */
export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/api/ipfs/upload-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/**
 * Upload NFT metadata JSON to IPFS
 */
export async function uploadMetadata(metadata: {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
}): Promise<UploadMetadataResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ipfs/upload-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload metadata',
    };
  }
}

/**
 * Upload both image and metadata in one call
 */
export async function uploadNFT(
  file: File,
  metadata: {
    name: string;
    description: string;
    attributes?: NFTAttribute[];
  }
): Promise<UploadNFTResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', metadata.name);
  formData.append('description', metadata.description);
  if (metadata.attributes) {
    formData.append('attributes', JSON.stringify(metadata.attributes));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/ipfs/upload-nft`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading NFT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload NFT',
    };
  }
}

/**
 * Check IPFS service health
 */
export async function checkHealth(): Promise<{
  status: string;
  pinataConfigured: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ipfs/health`);
    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      pinataConfigured: false,
    };
  }
}
