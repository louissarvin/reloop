import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import { Loader2, Search, SlidersHorizontal, ArrowLeftRight, CheckCircle2, ShoppingCart, X } from 'lucide-react';
import {
  fetchListings,
  fetchTokenDetail,
  fetchTokenMetadata,
  fetchMarketplaceStats,
  formatIpfsUrl,
  formatPrice,
  formatAddress,
  type Listing,
  type Token,
  type MarketplaceStats,
} from '../services/ponder';
import {
  useUSDCApprove,
  useUSDCAllowance,
  useBuyToken,
} from '../contracts';
import { getReLoopMarketplaceAddress } from '../contracts/addresses';

interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
}

interface ListingWithMeta extends Listing {
  token?: Token;
  metadata?: TokenMetadata | null;
}

interface BuyModalProps {
  listing: ListingWithMeta;
  onClose: () => void;
  onSuccess: () => void;
}

function BuyModal({ listing, onClose, onSuccess }: BuyModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<'confirm' | 'approving' | 'buying'>('confirm');

  const marketplaceAddress = getReLoopMarketplaceAddress();
  const { data: allowance } = useUSDCAllowance(address, marketplaceAddress);

  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useUSDCApprove();
  const { buy, isPending: isBuying, isSuccess: buySuccess, error: buyError } = useBuyToken();

  const price = BigInt(listing.price);
  const hasAllowance = allowance && allowance >= price;

  useEffect(() => {
    if (approveSuccess && step === 'approving') {
      setStep('buying');
      buy(BigInt(listing.tokenId));
    }
  }, [approveSuccess, step, listing.tokenId, buy]);

  useEffect(() => {
    if (buySuccess) {
      onSuccess();
    }
  }, [buySuccess, onSuccess]);

  const handleBuy = () => {
    if (hasAllowance) {
      setStep('buying');
      buy(BigInt(listing.tokenId));
    } else {
      setStep('approving');
      approve(marketplaceAddress, price);
    }
  };

  const isLoading = isApproving || isBuying;
  const formattedPrice = formatPrice(listing.price, 6);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Confirm Purchase</h3>
          <button onClick={onClose} disabled={isLoading} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <img
            src={listing.metadata?.image ? formatIpfsUrl(listing.metadata.image) : '/placeholder-car.png'}
            alt={listing.metadata?.name || 'NFT'}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-lg">
              {listing.metadata?.name || `Token #${listing.tokenId}`}
            </h4>
            <p className="text-sm text-gray-500 mb-2">
              Depth: {listing.token?.depth || 0} generations
            </p>
            <p className="text-sm text-gray-500">
              Seller: {formatAddress(listing.seller)}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Price</span>
            <span className="text-2xl font-bold font-mono">${formattedPrice} USDC</span>
          </div>
        </div>

        {buyError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {buyError.message}
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={isLoading}
          className="w-full bg-foreground text-background py-4 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isApproving && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Approving USDC...
            </>
          )}
          {isBuying && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Completing Purchase...
            </>
          )}
          {!isLoading && (
            <>
              <ShoppingCart size={20} />
              Buy for ${formattedPrice} USDC
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          {!hasAllowance && "You'll be asked to approve USDC spending first."}
        </p>
      </div>
    </div>
  );
}

export function Marketplace() {
  const { address, isConnected } = useAccount();

  const [listings, setListings] = useState<ListingWithMeta[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingListing, setBuyingListing] = useState<ListingWithMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingsData, statsData] = await Promise.all([
        fetchListings(50, 0),
        fetchMarketplaceStats(),
      ]);

      setStats(statsData);

      // Fetch token details and metadata for each listing
      const listingsWithMeta = await Promise.all(
        listingsData.listings.map(async (listing) => {
          try {
            const tokenDetail = await fetchTokenDetail(listing.tokenId);
            const metadata = await fetchTokenMetadata(tokenDetail.token.tokenUri);
            return {
              ...listing,
              token: tokenDetail.token,
              metadata,
            };
          } catch {
            return listing;
          }
        })
      );

      setListings(listingsWithMeta);
    } catch (err) {
      console.error('Error loading marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter listings by search query
  const filteredListings = listings.filter((listing) => {
    if (!searchQuery) return true;
    const name = listing.metadata?.name?.toLowerCase() || '';
    const tokenId = listing.tokenId.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || tokenId.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
          <p className="text-gray-500">Browse verified listings with resale potential.</p>
        </div>

        {stats && (
          <div className="flex gap-4 text-sm">
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-gray-500">Listings: </span>
              <span className="font-bold">{stats.activeListings}</span>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-gray-500">Volume: </span>
              <span className="font-bold">${formatPrice(stats.totalVolume, 6)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
          <SlidersHorizontal size={18} /> Filters
        </button>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-300" size={32} />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No listings found</p>
          {isConnected && (
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-gray-800"
            >
              Mint & List Your First NFT
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="group bg-surface rounded-xl overflow-hidden border border-border hover:border-gray-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Image Container */}
              <Link to={`/asset/${listing.tokenId}`} className="block">
                <div className="aspect-[16/10] overflow-hidden relative bg-gray-100">
                  <img
                    src={listing.metadata?.image ? formatIpfsUrl(listing.metadata.image) : '/placeholder-car.png'}
                    alt={listing.metadata?.name || `Token #${listing.tokenId}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Cascade Badge */}
                  {listing.token && listing.token.depth > 0 && (
                    <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded-md border border-gray-200 shadow-sm flex items-center gap-1.5">
                      <ArrowLeftRight size={14} className="text-highlight" />
                      <span className="text-foreground">Loop Enabled</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="p-4">
                <Link to={`/asset/${listing.tokenId}`}>
                  <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2 mb-2 hover:text-accent">
                    {listing.metadata?.name || `Token #${listing.tokenId}`}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  {listing.token && (
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                      Gen {listing.token.depth}
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-highlight" /> Verified
                  </span>
                  <span>•</span>
                  <span>{formatAddress(listing.seller)}</span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Price</div>
                    <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                      ${formatPrice(listing.price, 6)}
                    </div>
                  </div>

                  {isConnected && address?.toLowerCase() !== listing.seller.toLowerCase() ? (
                    <button
                      onClick={() => setBuyingListing(listing)}
                      className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
                    >
                      <ShoppingCart size={16} />
                      Buy
                    </button>
                  ) : (
                    <Link
                      to={`/asset/${listing.tokenId}`}
                      className="text-accent text-sm font-medium hover:underline"
                    >
                      View Details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy Modal */}
      {buyingListing && (
        <BuyModal
          listing={buyingListing}
          onClose={() => setBuyingListing(null)}
          onSuccess={() => {
            setBuyingListing(null);
            loadData(); // Refresh listings
          }}
        />
      )}
    </div>
  );
}
