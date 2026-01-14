import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { BadgeDollarSign, CarFront, Wallet, Loader2, Tag, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchUserProfile,
  fetchTokenMetadata,
  formatIpfsUrl,
  formatPrice,
  formatAddress,
  type Token,
  type UserProfileResponse,
} from '../services/ponder';
import {
  useUSDCBalance,
  useApproveNFT,
  useListToken,
} from '../contracts';
import { getReLoopMarketplaceAddress } from '../contracts/addresses';

interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
}

interface ListModalProps {
  token: Token;
  metadata: TokenMetadata | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ListModal({ token, metadata, onClose, onSuccess }: ListModalProps) {
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<'input' | 'approving' | 'listing'>('input');

  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveNFT();
  const { list, isPending: isListing, isSuccess: listSuccess, error: listError } = useListToken();

  const marketplaceAddress = getReLoopMarketplaceAddress();

  useEffect(() => {
    if (approveSuccess && step === 'approving') {
      setStep('listing');
      // Convert price to USDC units (6 decimals)
      const priceInUnits = BigInt(Math.floor(parseFloat(price) * 1_000_000));
      list(BigInt(token.tokenId), priceInUnits);
    }
  }, [approveSuccess, step, price, token.tokenId, list]);

  useEffect(() => {
    if (listSuccess) {
      onSuccess();
    }
  }, [listSuccess, onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) return;

    setStep('approving');
    approve(marketplaceAddress, BigInt(token.tokenId));
  };

  const isLoading = isApproving || isListing;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">List for Sale</h3>
          <button onClick={onClose} disabled={isLoading} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <img
            src={metadata?.image ? formatIpfsUrl(metadata.image) : '/placeholder-car.png'}
            alt={metadata?.name || 'NFT'}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div>
            <h4 className="font-semibold">{metadata?.name || `Token #${token.tokenId}`}</h4>
            <p className="text-sm text-gray-500">Depth: {token.depth} generations</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Price (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price in USDC"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-foreground focus:outline-none"
              disabled={isLoading}
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
            disabled={isLoading || !price}
            className="w-full bg-foreground text-background py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isApproving && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Approving NFT...
              </>
            )}
            {isListing && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Listing...
              </>
            )}
            {!isLoading && (
              <>
                <Tag size={18} />
                List for {price || '0'} USDC
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function Portfolio() {
  const { address, isConnected } = useAccount();
  const { data: usdcBalance } = useUSDCBalance(address);

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata | null>>({});
  const [loading, setLoading] = useState(true);
  const [listingToken, setListingToken] = useState<Token | null>(null);

  const loadProfile = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const data = await fetchUserProfile(address);
      setProfile(data);

      // Fetch metadata for all owned tokens
      const metadataPromises = data.ownedTokens.map(async (token) => {
        const meta = await fetchTokenMetadata(token.tokenUri);
        return { id: token.id, meta };
      });

      const results = await Promise.all(metadataPromises);
      const metadataMap: Record<string, TokenMetadata | null> = {};
      results.forEach(({ id, meta }) => {
        metadataMap[id] = meta;
      });
      setTokenMetadata(metadataMap);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadProfile();
    }
  }, [address]);

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
            Connect your wallet to view your garage, NFTs, and earnings.
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const formattedBalance = usdcBalance ? formatPrice(usdcBalance.toString(), 6) : '0';
  const formattedEarnings = profile?.stats.profitReceived
    ? formatPrice(profile.stats.profitReceived, 6)
    : '0';

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Garage</h1>
        <div className="text-sm text-gray-500 font-mono">
          {formatAddress(address!)}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">USDC Balance</div>
          <div className="text-3xl font-mono font-bold">${formattedBalance}</div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">Loop Earnings</div>
          <div className="text-3xl font-mono font-bold text-accent flex items-center gap-2">
            <BadgeDollarSign size={28} />
            ${formattedEarnings}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">Owned NFTs</div>
          <div className="text-3xl font-mono font-bold flex items-center gap-2">
            <CarFront size={28} />
            {profile?.ownedTokens.length || 0}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Minted</div>
          <div className="text-3xl font-mono font-bold">
            {profile?.stats.tokensMinted || 0}
          </div>
        </div>
      </div>

      {/* Owned NFTs */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">My NFTs</h2>
        <Link
          to="/create"
          className="text-sm text-accent hover:underline font-medium"
        >
          + Mint New
        </Link>
      </div>

      {profile?.ownedTokens.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center text-gray-500">
          <CarFront className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="font-medium mb-2">No NFTs yet</p>
          <p className="text-sm mb-6">Mint your first car NFT or buy one from the marketplace.</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/create"
              className="px-6 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-gray-800"
            >
              Mint NFT
            </Link>
            <Link
              to="/marketplace"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile?.ownedTokens.map((token) => {
            const meta = tokenMetadata[token.id];
            return (
              <div
                key={token.id}
                className="bg-surface rounded-xl overflow-hidden border border-border hover:border-gray-300 hover:shadow-lg transition-all"
              >
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  <img
                    src={meta?.image ? formatIpfsUrl(meta.image) : '/placeholder-car.png'}
                    alt={meta?.name || `Token #${token.tokenId}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">
                    {meta?.name || `Token #${token.tokenId}`}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                      Depth {token.depth}
                    </span>
                    <span>•</span>
                    <span>Token #{token.tokenId}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setListingToken(token)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Tag size={16} />
                      List for Sale
                    </button>
                    <Link
                      to={`/asset/${token.tokenId}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Profit Distributions */}
      {profile && profile.recentProfits.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Recent Loop Earnings</h2>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Token</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Generation</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {profile.recentProfits.slice(0, 10).map((profit) => (
                  <tr key={profit.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono text-sm">#{profit.tokenId}</td>
                    <td className="px-4 py-3 text-sm">Gen {profit.generation + 1}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-green-600">
                      +${formatPrice(profit.amount, 6)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`https://sepolia.mantlescan.xyz/tx/${profit.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent text-sm hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* List Modal */}
      {listingToken && (
        <ListModal
          token={listingToken}
          metadata={tokenMetadata[listingToken.id]}
          onClose={() => setListingToken(null)}
          onSuccess={() => {
            setListingToken(null);
            loadProfile(); // Refresh data
          }}
        />
      )}
    </div>
  );
}
