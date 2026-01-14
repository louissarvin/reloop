import { useState, useRef, useEffect } from 'react';
import { Car, Wallet, Loader2, Image, X, ExternalLink, Tag, Share2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useMintToken } from '../contracts';
import { uploadNFT } from '../services/ipfs';

type MintStep = 'idle' | 'uploading' | 'confirming' | 'minting' | 'success' | 'error';

export function Create() {
  const { address, isConnected } = useAccount();
  const { mint, isPending, isConfirming, isSuccess, error: mintError, hash } = useMintToken();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    depth: 3,
    splits: [6, 4, 2]
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [step, setStep] = useState<MintStep>('idle');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 10MB');
      return;
    }

    setUploadError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateSplit = (index: number, val: number) => {
    const newSplits = [...formData.splits];
    newSplits[index] = val;
    setFormData({ ...formData, splits: newSplits });
  };

  const handleDepthChange = (d: number) => {
    const newSplits = Array(d).fill(0).map((_, i) => Math.max(1, 4 - i));
    setFormData({ ...formData, depth: d, splits: newSplits });
  };

  const totalSplit = formData.splits.reduce((a, b) => a + b, 0);
  const maxSplit = formData.depth * 4;
  const isValid = totalSplit <= maxSplit && imageFile !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !imageFile) return;

    setUploadError(null);
    setStep('uploading');

    // Step 1: Upload image and metadata to IPFS
    const attributes = [
      { trait_type: 'Price', value: formData.price },
      { trait_type: 'Depth', value: formData.depth },
      ...formData.splits.map((split, i) => ({
        trait_type: `Gen ${i + 1} Split`,
        value: `${split}%`
      }))
    ];

    const uploadResult = await uploadNFT(imageFile, {
      name: formData.name,
      description: formData.description,
      attributes,
    });

    if (!uploadResult.success || !uploadResult.tokenUri) {
      setUploadError(uploadResult.error || 'Failed to upload to IPFS');
      setStep('error');
      return;
    }

    // Step 2: Mint the NFT with the IPFS URI
    setStep('confirming');
    const splitsBps = formData.splits.map(s => s * 100);

    try {
      await mint(address, uploadResult.tokenUri, formData.depth, splitsBps);
    } catch (err) {
      setStep('error');
    }
  };

  // Update step based on mint status
  if (isPending && step !== 'confirming') setStep('confirming');
  if (isConfirming && step !== 'minting') setStep('minting');
  if (isSuccess && step !== 'success') setStep('success');

  // Redirect to portfolio after successful mint (with delay to show success message)
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/portfolio');
      }, 3000); // 3 second delay to show success message
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const isLoading = step === 'uploading' || isPending || isConfirming;
  const displayError = uploadError || mintError?.message;

  // Wallet Connection Gate
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Connect Your Wallet</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Connect your wallet to list your car on ReLoop and start earning from future resales.
          </p>
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button
                onClick={show}
                className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors"
              >
                <Wallet size={20} />
                Connect Wallet
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">List Your Car</h1>
        <p className="text-gray-500">Enable the Resale Loop to earn from future sales.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-surface p-8 rounded-2xl border border-border shadow-sm">

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Vehicle Details
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make & Model</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-foreground focus:outline-none transition-all"
                placeholder="e.g., 2024 Tesla Model Y"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-foreground focus:outline-none transition-all resize-none"
                placeholder="Describe your vehicle: condition, mileage, features, history..."
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
                disabled={isLoading}
              />
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Listing Price (USDC)</label>
               <input
                 type="number"
                 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-foreground focus:outline-none transition-all"
                 placeholder="35000"
                 value={formData.price}
                 onChange={e => setFormData({...formData, price: e.target.value})}
                 required
                 disabled={isLoading}
               />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Car Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isLoading}
            />

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={isLoading}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors disabled:opacity-50"
                >
                  <X size={16} className="text-gray-600" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                  {imageFile?.name}
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <Image className="mx-auto text-gray-400 mb-2" size={32} />
                <span className="text-sm text-gray-500 block">Click to upload car photo</span>
                <span className="text-xs text-gray-400 mt-1 block">JPEG, PNG, WebP, GIF (max 10MB)</span>
              </div>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Loop Config */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Resale Loop Config
            </h3>
            <div className={`text-sm font-medium px-2 py-0.5 rounded rounded-lg ${totalSplit <= maxSplit ? 'bg-[#008170] text-white' : 'bg-red-100 text-red-700'}`}>
              Total: {totalSplit}% / Max {maxSplit}%
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Loop Depth (Generations)</label>
             <div className="flex gap-2">
               {[0, 1, 2, 3, 4, 5].map(d => (
                 <button
                   key={d}
                   type="button"
                   onClick={() => handleDepthChange(d)}
                   disabled={isLoading}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                     formData.depth === d
                       ? 'bg-foreground text-background border-foreground'
                       : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                   } disabled:opacity-50`}
                 >
                   {d === 0 ? 'None' : d}
                 </button>
               ))}
             </div>
             <p className="text-xs text-gray-500 mt-2">
               {formData.depth === 0
                  ? "Standard sale. No future earnings."
                  : `You and the next ${formData.depth - 1} owners will earn from future sales.`}
             </p>
          </div>

          {formData.depth > 0 && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
              <label className="block text-sm font-medium text-gray-700">Profit Split per Generation (%)</label>
              <div className="grid grid-cols-5 gap-2">
                {formData.splits.map((split, i) => (
                  <div key={i} className="text-center">
                    <label className="text-xs text-gray-400 block mb-1">Gen {i + 1}</label>
                    <input
                      type="number"
                      className="w-full text-center py-1.5 rounded rounded-lg border border-gray-300 text-sm disabled:opacity-50"
                      value={split}
                      onChange={e => updateSplit(i, parseInt(e.target.value) || 0)}
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <strong>Error:</strong> {displayError}
          </div>
        )}

        {/* Success Message with Post-Mint Actions */}
        {isSuccess && hash && (
          <div className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 mb-1">Car Listed Successfully!</h4>
                  <p className="text-green-700 text-sm mb-3">
                    Your {formData.name} has been minted as an NFT with {formData.depth} generation profit cascade.
                  </p>
                  <a
                    href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 underline"
                  >
                    View transaction <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>

            {/* Post-Mint Actions */}
            <p className="text-sm text-gray-500 mb-3">Redirecting to your portfolio in 3 seconds...</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/portfolio"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                <Car size={18} />
                View My NFTs
              </Link>
              <Link
                to="/marketplace"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Tag size={18} />
                Browse Marketplace
              </Link>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/marketplace`;
                  navigator.clipboard.writeText(url);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <Share2 size={18} />
                Share Listing
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isValid || isSuccess}
          className="w-full bg-foreground text-background font-bold py-4 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {step === 'uploading' && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading to IPFS...
            </>
          )}
          {isPending && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirm in Wallet...
            </>
          )}
          {isConfirming && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Minting...
            </>
          )}
          {isSuccess && 'Minted Successfully!'}
          {step === 'idle' && !isSuccess && (
            imageFile ? 'Create Listing' : 'Upload Photo to Continue'
          )}
          {step === 'error' && 'Try Again'}
        </button>

      </form>
    </div>
  );
}
