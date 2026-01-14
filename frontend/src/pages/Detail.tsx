import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ArrowLeft, Share2, ShieldCheck, Tag, Loader2, ShoppingCart, Clock, User, X } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
        <div className="text-center py-20">
          <p className="text-gray-500">{error || 'Token not found'}</p>
        </div>
      </div>
    );
  }

  const { token, listing, ownerHistory, sales } = data;
  const isOwner = address?.toLowerCase() === token.owner.toLowerCase();
  const isListed = listing?.active;
  const splits = JSON.parse(token.profitSplitsBps || '[]').map((bps: number) => bps / 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-7 space-y-8">
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-border">
            <img
              src={metadata?.image ? formatIpfsUrl(metadata.image) : '/placeholder-car.png'}
              alt={metadata?.name || `Token #${token.tokenId}`}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">
              {metadata?.name || `Token #${token.tokenId}`}
            </h1>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700">
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
                      <div className="font-medium text-foreground">{attr.value}</div>
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
        </div>

        {/* Right Column: Interactive Panel */}
        <div className="lg:col-span-5 space-y-6">
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
              <button
                onClick={() => setShowBuyModal(true)}
                className="w-full bg-foreground text-background font-semibold py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all mb-4 shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Buy Now
              </button>
            )}

            {isConnected && isOwner && !isListed && (
              <button
                onClick={() => setShowListModal(true)}
                className="w-full bg-foreground text-background font-semibold py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all mb-4 shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
              >
                <Tag size={20} />
                List for Sale
              </button>
            )}

            {isOwner && isListed && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Your NFT is currently listed for sale
              </div>
            )}

            {!isConnected && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Connect your wallet to buy or list
              </div>
            )}

            <p className="text-xs text-center text-gray-400">
              Secured by ReLoop Smart Contracts.
            </p>

            {token.depth > 0 && (
              <>
                <hr className="my-6 border-gray-100" />
                <CascadeVisualizer splits={splits} depth={token.depth} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && listing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
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
              {!isApprovingUSDC && !isBuying && <><ShoppingCart size={20} /> Buy Now</>}
            </button>
          </div>
        </div>
      )}

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
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
          </div>
        </div>
      )}
    </div>
  );
}
