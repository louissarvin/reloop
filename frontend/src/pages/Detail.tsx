import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, ShieldCheck, Tag, Loader2, Clock, User, X, Heart, Mail, Phone, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { addInterest, decryptPhone } from '../services/contact';
import {
  fetchTokenDetail,
  fetchTokenMetadata,
  formatIpfsUrl,
  formatPrice,
  formatAddress,
  type TokenDetailResponse,
} from '../services/ponder';
import { CascadeVisualizer } from '../components/CascadeVisualizer';
import {
  useUSDCApprove,
  useUSDCAllowance,
  useBuyToken,
  useApproveNFT,
  useListToken,
} from '../contracts';
import { getReLoopMarketplaceAddress } from '../contracts/addresses';

interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  gallery?: string[];
  encryptedContact?: string;
}

export function Detail() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useAccount();

  const [data, setData] = useState<TokenDetailResponse | null>(null);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buy modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStep, setBuyStep] = useState<'confirm' | 'approving' | 'buying'>('confirm');

  // List modal state
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [listStep, setListStep] = useState<'input' | 'approving' | 'listing'>('input');

  // Interest modal state
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestEmail, setInterestEmail] = useState('');
  const [interestPhone, setInterestPhone] = useState('');
  const [interestMessage, setInterestMessage] = useState('');
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const marketplaceAddress = getReLoopMarketplaceAddress();
  const { data: allowance } = useUSDCAllowance(address, marketplaceAddress);

  // Buy hooks
  const { approve: approveUSDC, isPending: isApprovingUSDC, isSuccess: approveUSDCSuccess } = useUSDCApprove();
  const { buy, isPending: isBuying, isSuccess: buySuccess, error: buyError } = useBuyToken();

  // List hooks
  const { approve: approveNFT, isPending: isApprovingNFT, isSuccess: approveNFTSuccess } = useApproveNFT();
  const { list, isPending: isListing, isSuccess: listSuccess, error: listError } = useListToken();

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const tokenData = await fetchTokenDetail(id);
      setData(tokenData);

      if (tokenData.token.tokenUri) {
        const meta = await fetchTokenMetadata(tokenData.token.tokenUri);
        setMetadata(meta);
      }
    } catch (err) {
      console.error('Error loading token:', err);
      setError('Failed to load token details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Buy flow
  useEffect(() => {
    if (approveUSDCSuccess && buyStep === 'approving') {
      setBuyStep('buying');
      buy(BigInt(id!));
    }
  }, [approveUSDCSuccess, buyStep, id, buy]);

  useEffect(() => {
    if (buySuccess) {
      setShowBuyModal(false);
      loadData();
    }
  }, [buySuccess]);

  // List flow
  useEffect(() => {
    if (approveNFTSuccess && listStep === 'approving') {
      setListStep('listing');
      const priceInUnits = BigInt(Math.floor(parseFloat(listPrice) * 1_000_000));
      list(BigInt(id!), priceInUnits);
    }
  }, [approveNFTSuccess, listStep, listPrice, id, list]);

  useEffect(() => {
    if (listSuccess) {
      setShowListModal(false);
      loadData();
    }
  }, [listSuccess]);

  const handleBuy = () => {
    if (!data?.listing) return;
    const price = BigInt(data.listing.price);
    const hasAllowance = allowance && allowance >= price;

    if (hasAllowance) {
      setBuyStep('buying');
      buy(BigInt(id!));
    } else {
      setBuyStep('approving');
      approveUSDC(marketplaceAddress, price);
    }
  };

  const handleList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listPrice || parseFloat(listPrice) <= 0) return;

    setListStep('approving');
    approveNFT(marketplaceAddress, BigInt(id!));
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestEmail && !interestPhone) return;
    if (!data) return;

    // Save interest to backend (will send email to buyer with seller's phone)
    await addInterest({
      tokenId: id!,
      sellerAddress: data.token.owner,
      buyerEmail: interestEmail || undefined,
      buyerPhone: interestPhone || undefined,
      buyerAddress: address,
      message: interestMessage || undefined,
      encryptedSellerPhone: metadata?.encryptedContact,
      tokenName: metadata?.name || `Token #${id}`,
    });

    // Also reveal the seller's phone in the UI
    if (metadata?.encryptedContact) {
      const phone = decryptPhone(metadata.encryptedContact);
      setRevealedPhone(phone);
    }

    setInterestSubmitted(true);
  };

  // Gallery navigation
  const galleryImages = metadata?.gallery || (metadata?.image ? [metadata.image] : []);
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div
        className="max-w-7xl mx-auto px-6 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
        <div className="text-center py-20">
          <p className="text-gray-500">{error || 'Token not found'}</p>
        </div>
      </motion.div>
    );
  }

  const { token, listing, ownerHistory, sales } = data;
  const isOwner = address?.toLowerCase() === token.owner.toLowerCase();
  const isListed = listing?.active;
  const splits = JSON.parse(token.profitSplitsBps || '[]').map((bps: number) => bps / 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image & Details */}
        <motion.div
          className="lg:col-span-7 space-y-8"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Image with Gallery Navigation */}
          <div className="relative">
            <motion.div
              className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-border"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={galleryImages[currentImageIndex] ? formatIpfsUrl(galleryImages[currentImageIndex]) : '/placeholder-car.png'}
                  alt={metadata?.name || `Token #${token.tokenId}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
            </motion.div>

            {/* Gallery Navigation */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded text-xs text-white">
                  {currentImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {galleryImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {galleryImages.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === currentImageIndex ? 'border-foreground' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={formatIpfsUrl(img)}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {galleryImages.length > 5 && (
                <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                  +{galleryImages.length - 5}
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">
              {metadata?.name || `Token #${token.tokenId}`}
            </h1>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm bg-gray-100 py-1.5 rounded-lg text-gray-700">
                <ShieldCheck size={16} className="text-highlight" />
                Verified Ownership
              </div>
              {token.depth > 0 && (
                <div className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700">
                  <Tag size={16} className="text-highlight" />
                  Resale Loop Active
                </div>
              )}
            </div>

            {metadata?.description && (
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{metadata.description}</p>
              </div>
            )}

            {/* Attributes */}
            {metadata?.attributes && metadata.attributes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Attributes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {metadata.attributes.map((attr, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{attr.trait_type}</div>
                      <div className="font-medium text-foreground">
                        {attr.trait_type === 'Price' ? `$${Number(attr.value).toLocaleString()}` : attr.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner History */}
            {ownerHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Owner History</h3>
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                  {ownerHistory.map((record, i) => (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="font-mono text-sm">{formatAddress(record.owner)}</div>
                          <div className="text-xs text-gray-500">
                            {record.purchasePrice === '0' ? 'Minted' : `Bought for $${formatPrice(record.purchasePrice, 6)}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {new Date(Number(record.timestamp) * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Interactive Panel */}
        <motion.div
          className="lg:col-span-5 space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm sticky top-24">
            <div className="flex items-start justify-between mb-6">
              <div>
                {isListed ? (
                  <>
                    <div className="text-sm text-gray-500 font-medium mb-1">Current Price</div>
                    <div className="text-4xl font-bold font-mono text-foreground">
                      ${formatPrice(listing!.price, 6)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Seller: {formatAddress(listing!.seller)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 font-medium mb-1">Status</div>
                    <div className="text-2xl font-bold text-foreground">Not Listed</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Owner: {formatAddress(token.owner)}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <Share2 size={20} />
              </button>
            </div>

            {/* Action Buttons */}
            {isConnected && isListed && !isOwner && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="w-full bg-foreground text-background font-semibold py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => setShowInterestModal(true)}
                  className="w-full bg-[#008170] text-white font-semibold py-4 rounded-xl hover:bg-[#006954] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  I'm Interested
                </button>
              </div>
            )}

            {/* Interest button for non-listed items */}
            {isConnected && !isListed && !isOwner && (
              <button
                onClick={() => setShowInterestModal(true)}
                className="w-full bg-[#008170] text-white font-semibold py-4 rounded-xl hover:bg-[#006954] active:scale-[0.98] transition-all mb-4 flex items-center justify-center gap-2 border border-[#006954]"
              >
                I'm Interested - Contact Owner
              </button>
            )}

            {isConnected && isOwner && !isListed && (
              <button
                onClick={() => {
                  // Pre-fill price: prefer last sale price, fallback to original mint price
                  const lastOwnerRecord = ownerHistory[ownerHistory.length - 1];
                  const lastSalePrice = lastOwnerRecord?.purchasePrice && lastOwnerRecord.purchasePrice !== '0'
                    ? formatPrice(lastOwnerRecord.purchasePrice, 6)
                    : null;
                  const originalPrice = metadata?.attributes?.find(a => a.trait_type === 'Price')?.value;

                  if (lastSalePrice) {
                    setListPrice(lastSalePrice);
                  } else if (originalPrice) {
                    setListPrice(String(originalPrice));
                  }
                  setShowListModal(true);
                }}
                className="w-full bg-foreground text-background font-semibold py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all mb-4 shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
              >
                List for Sale
              </button>
            )}

            {isOwner && isListed && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Your NFT is currently listed for sale
              </div>
            )}

            {!isConnected && (
              <div className="space-y-3">
                <div className="text-center py-2 text-gray-500 text-sm">
                  Connect your wallet to buy or list
                </div>
                <button
                  onClick={() => setShowInterestModal(true)}
                  className="w-full bg-[#008170] text-white font-semibold py-3 rounded-xl hover:bg-[#006954] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-[#006954]"
                >
                  I'm Interested
                </button>
              </div>
            )}

            <p className="text-xs text-center text-gray-400 mt-4">
              Secured by ReLoop Smart Contracts.
            </p>

            {token.depth > 0 && (
              <>
                <hr className="my-6 border-gray-100" />
                <CascadeVisualizer splits={splits} depth={token.depth} />
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Buy Modal */}
      <AnimatePresence>
        {showBuyModal && listing && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Confirm Purchase</h3>
              <button onClick={() => setShowBuyModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Price</span>
                <span className="text-2xl font-bold font-mono">${formatPrice(listing.price, 6)} USDC</span>
              </div>
            </div>

            {buyError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {buyError.message}
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={isApprovingUSDC || isBuying}
              className="w-full bg-foreground text-background py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isApprovingUSDC && <><Loader2 className="w-5 h-5 animate-spin" /> Approving USDC...</>}
              {isBuying && <><Loader2 className="w-5 h-5 animate-spin" /> Completing Purchase...</>}
              {!isApprovingUSDC && !isBuying && <> Buy Now</>}
            </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Modal */}
      <AnimatePresence>
        {showListModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">List for Sale</h3>
              <button onClick={() => setShowListModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleList}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Listing Price (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="Enter price in USDC"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-foreground focus:outline-none"
                  disabled={isApprovingNFT || isListing}
                  required
                />
                {/* Price History Info */}
                <div className="mt-3 space-y-1">
                  {metadata?.attributes?.find(a => a.trait_type === 'Price') && (
                    <p className="text-xs text-gray-500">
                      Original mint price: <span className="font-medium">${Number(metadata.attributes.find(a => a.trait_type === 'Price')?.value).toLocaleString()} USDC</span>
                    </p>
                  )}
                  {ownerHistory.length > 0 && ownerHistory[ownerHistory.length - 1]?.purchasePrice !== '0' && (
                    <p className="text-xs text-green-600">
                      Last sold for: <span className="font-medium">${formatPrice(ownerHistory[ownerHistory.length - 1].purchasePrice, 6)} USDC</span>
                    </p>
                  )}
                </div>
              </div>

              {listError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {listError.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isApprovingNFT || isListing || !listPrice}
                className="w-full bg-foreground text-background py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isApprovingNFT && <><Loader2 className="w-5 h-5 animate-spin" /> Approving NFT...</>}
                {isListing && <><Loader2 className="w-5 h-5 animate-spin" /> Creating Listing...</>}
                {!isApprovingNFT && !isListing && <><Tag size={20} /> List for {listPrice || '0'} USDC</>}
              </button>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interest Modal */}
      <AnimatePresence>
        {showInterestModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {!interestSubmitted ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      Show Interest
                    </h3>
                    <button
                      onClick={() => setShowInterestModal(false)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-6">
                    Enter your contact information to receive the seller's phone number.
                    This helps connect genuine buyers with sellers.
                  </p>

                  <form onSubmit={handleInterestSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-2">
                          Your Email
                        </span>
                      </label>
                      <input
                        type="email"
                        value={interestEmail}
                        onChange={(e) => setInterestEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008170] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-2">
                          Your Phone (optional)
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={interestPhone}
                        onChange={(e) => setInterestPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008170] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message to Seller (optional)
                      </label>
                      <textarea
                        value={interestMessage}
                        onChange={(e) => setInterestMessage(e.target.value)}
                        placeholder="I'm interested in this car because..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008170] focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!interestEmail && !interestPhone}
                      className="w-full bg-[#008170] text-white py-3 rounded-xl font-semibold hover:bg-[#006954] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Submit Interest
                    </button>
                  </form>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    Your contact info will be shared with the seller and stored securely.
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="text-green-600" size={32} />
                  </motion.div>

                  <h3 className="text-xl font-bold text-foreground mb-2">Interest Submitted!</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Thank you for your interest. Here's the seller's contact information:
                  </p>

                  {revealedPhone ? (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="text-sm text-gray-500 mb-1">Seller's Phone</div>
                      <div className="text-2xl font-bold font-mono text-foreground flex items-center justify-center gap-2">
                        <Phone size={20} className="text-green-600" />
                        {revealedPhone}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(revealedPhone)}
                        className="text-sm text-accent hover:underline mt-2"
                      >
                        Copy to clipboard
                      </button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 rounded-xl p-4 mb-6 text-yellow-700 text-sm">
                      No contact information available for this listing.
                      The seller may reach out to you directly.
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowInterestModal(false);
                      setInterestSubmitted(false);
                      setInterestEmail('');
                      setInterestPhone('');
                      setInterestMessage('');
                      setRevealedPhone(null);
                    }}
                    className="w-full bg-foreground text-background py-3 rounded-xl font-semibold hover:bg-gray-800"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
