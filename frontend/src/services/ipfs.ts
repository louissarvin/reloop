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

export interface UploadMultipleImagesResponse {
  success: boolean;
  images?: { ipfsHash: string; ipfsUrl: string }[];
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
 * Upload multiple images to IPFS
 */
export async function uploadMultipleImages(files: File[]): Promise<UploadMultipleImagesResponse> {
  try {
    const uploadPromises = files.map(file => uploadImage(file));
    const results = await Promise.all(uploadPromises);

    const successfulUploads = results.filter(r => r.success && r.ipfsHash && r.ipfsUrl);

    if (successfulUploads.length === 0) {
      return {
        success: false,
        error: 'Failed to upload any images',
      };
    }

    return {
      success: true,
      images: successfulUploads.map(r => ({
        ipfsHash: r.ipfsHash!,
        ipfsUrl: r.ipfsUrl!,
      })),
    };
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload images',
    };
  }
}

/**
 * Upload both image and metadata in one call (supports multiple images)
 */
export async function uploadNFT(
  files: File | File[],
  metadata: {
    name: string;
    description: string;
    attributes?: NFTAttribute[];
    encryptedPhone?: string;
  }
): Promise<UploadNFTResponse> {
  const fileArray = Array.isArray(files) ? files : [files];

  // Upload all images first
  const imageResults = await uploadMultipleImages(fileArray);

  if (!imageResults.success || !imageResults.images?.length) {
    return {
      success: false,
      error: imageResults.error || 'Failed to upload images',
    };
  }

  // Create metadata with main image and gallery
  const mainImage = imageResults.images[0].ipfsUrl;
  const galleryImages = imageResults.images.map(img => img.ipfsUrl);

  const fullMetadata = {
    name: metadata.name,
    description: metadata.description,
    image: mainImage,
    attributes: [
      ...(metadata.attributes || []),
      ...(galleryImages.length > 1 ? [{ trait_type: 'Gallery Count', value: galleryImages.length }] : []),
    ],
    // Store gallery images and encrypted phone in metadata
    gallery: galleryImages,
    ...(metadata.encryptedPhone && { encryptedContact: metadata.encryptedPhone }),
  };

  // Upload metadata
  const metadataResult = await uploadMetadata(fullMetadata as any);

  if (!metadataResult.success) {
    return {
      success: false,
      error: metadataResult.error || 'Failed to upload metadata',
    };
  }

  return {
    success: true,
    imageUrl: mainImage,
    tokenUri: metadataResult.tokenUri,
  };
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
