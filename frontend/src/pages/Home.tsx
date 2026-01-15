import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  BadgeDollarSign,
  TrendingUp,
  Users,
  Coins,
  Calculator,
  Zap,
  ShoppingCart,
} from 'lucide-react';
import {
  fetchListings,
  fetchMarketplaceStats,
  fetchSales,
  fetchTokenMetadata,
  fetchTokenDetail,
  formatIpfsUrl,
  formatPrice,
  formatAddress,
  type Listing,
  type Token,
  type Sale,
  type MarketplaceStats,
} from '../services/ponder';

// Fallback slides when no listings exist
const FALLBACK_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&q=80&fit=crop",
    title: "Bugatti Chiron",
    sub: "Featured Asset",
    desc: "Iconic German engineering with timeless design",
    tokenId: null as string | null,
  },
  {
    image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1600&q=80&fit=crop",
    title: "Lamborghini Huracán",
    sub: "Just Listed",
    desc: "Italian supercar with V10 power",
    tokenId: null as string | null,
  },
  {
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&q=80&fit=crop",
    title: "Classic Muscle Car",
    sub: "Trending",
    desc: "American heritage meets modern investment",
    tokenId: null as string | null,
  }
];

interface ListingWithMeta extends Listing {
  token?: Token;
  metadata?: { name?: string; image?: string } | null;
}

interface SaleWithMeta extends Sale {
  metadata?: { name?: string } | null;
}

export function Home() {
  const { isConnected } = useAccount();

  const [listings, setListings] = useState<ListingWithMeta[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [recentSales, setRecentSales] = useState<SaleWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Profit Calculator State
  const [calcPrice, setCalcPrice] = useState('10000');
  const [calcSplits] = useState([40, 25, 15, 10, 10]); // Default splits

  // Build hero slides from real listings or use fallback
  const heroSlides = listings.length > 0
    ? listings.slice(0, 3).map((listing, index) => ({
        image: listing.metadata?.image ? formatIpfsUrl(listing.metadata.image) : FALLBACK_SLIDES[index]?.image || '/placeholder-car.png',
        title: listing.metadata?.name || `Token #${listing.tokenId}`,
        sub: index === 0 ? 'Featured' : index === 1 ? 'Just Listed' : 'Popular',
        desc: `$${formatPrice(listing.price, 6)} USDC`,
        tokenId: listing.tokenId,
      }))
    : FALLBACK_SLIDES;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [listingsData, statsData, salesData] = await Promise.all([
          fetchListings(6, 0),
          fetchMarketplaceStats(),
          fetchSales(5, 0),
        ]);

        setStats(statsData);

        // Fetch metadata for listings
        const listingsWithMeta = await Promise.all(
          listingsData.listings.slice(0, 6).map(async (listing) => {
            try {
              const tokenDetail = await fetchTokenDetail(listing.tokenId);
              const metadata = await fetchTokenMetadata(tokenDetail.token.tokenUri);
              return { ...listing, token: tokenDetail.token, metadata };
            } catch {
              return listing;
            }
          })
        );
        setListings(listingsWithMeta);

        // Fetch metadata for recent sales
        const salesWithMeta = await Promise.all(
          salesData.sales.slice(0, 5).map(async (sale) => {
            try {
              const tokenDetail = await fetchTokenDetail(sale.tokenId);
              const metadata = await fetchTokenMetadata(tokenDetail.token.tokenUri);
              return { ...sale, metadata };
            } catch {
              return sale;
            }
          })
        );
        setRecentSales(salesWithMeta);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Carousel Logic
  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  };

  // Calculate projected earnings
  const calculateEarnings = () => {
    const price = parseFloat(calcPrice) || 0;
    const earnings: number[] = [];
    let currentPrice = price;

    // Assume 20% appreciation per resale for demo
    for (let i = 0; i < 5; i++) {
      currentPrice = currentPrice * 1.2;
      const profit = currentPrice * (calcSplits[i] / 100) * 0.1; // 10% total profit split
      earnings.push(profit);
    }

    return earnings;
  };

  const projectedEarnings = calculateEarnings();
  const totalEarnings = projectedEarnings.reduce((a, b) => a + b, 0);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#0F0F0F] text-white pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#232D3F] rounded-full blur-[120px] opacity-50 translate-x-1/3 -translate-y-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-white/20 text-sm backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#008170] animate-pulse" />
              <span className="font-medium text-[#008170]">Live On Mantle Network</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              Buy Cars That <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008170] to-[#005B41]">
                Pay You Back.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-400 max-w-lg leading-relaxed"
            >
              The first marketplace where ownership history pays dividends.
              Earn a share of the sale price every time your car is resold.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <Link
                to="/marketplace"
                className="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                Browse Inventory <ArrowRight size={20} />
              </Link>
              <Link
                to="/create"
                className="px-8 py-4 rounded-xl font-medium border border-white/20 hover:bg-white/10 transition-colors text-white"
              >
                Sell Your Car
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative hidden lg:block group"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
             <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 aspect-[4/3]">
               {heroSlides.map((slide, index) => (
                 <div
                   key={index}
                   className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                     index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                   }`}
                 >
                   {slide.tokenId ? (
                     <Link to={`/asset/${slide.tokenId}`} className="block w-full h-full">
                       <img
                         src={slide.image}
                         alt={slide.title}
                         className="w-full h-full object-cover"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                       <div className="absolute bottom-6 left-6 right-6">
                         <div className="text-[#008170] text-xs font-semibold uppercase tracking-wider mb-1">{slide.sub}</div>
                         <div className="text-2xl font-bold text-white mb-1">{slide.title}</div>
                         <div className="text-white/70 text-sm">{slide.desc}</div>
                       </div>
                     </Link>
                   ) : (
                     <div className="w-full h-full cursor-pointer" onClick={nextSlide}>
                       <img
                         src={slide.image}
                         alt={slide.title}
                         className="w-full h-full object-cover"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                       <div className="absolute bottom-6 left-6 right-6">
                         <div className="text-[#008170] text-xs font-semibold uppercase tracking-wider mb-1">{slide.sub}</div>
                         <div className="text-2xl font-bold text-white mb-1">{slide.title}</div>
                         <div className="text-white/70 text-sm">{slide.desc}</div>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
             </div>

             {/* Slide indicators */}
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
               {heroSlides.map((_, index) => (
                 <button
                   key={index}
                   onClick={() => setCurrentSlide(index)}
                   className={`w-2 h-2 rounded-full transition-all ${
                     index === currentSlide ? 'bg-[#008170] w-6' : 'bg-white/30 hover:bg-white/50'
                   }`}
                 />
               ))}
             </div>

             <div className="absolute inset-0 -z-10 border-2 border-[#008170]/30 rounded-3xl rotate-6 scale-105 transition-transform duration-1000 group-hover:rotate-3 group-hover:scale-100" />
          </motion.div>
        </div>
      </section>

      {/* Live Stats Banner */}
      <section className="bg-gradient-to-r from-[#008170] to-[#005B41] text-white py-6">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {[
              { value: stats ? formatPrice(stats.totalVolume, 6) : '0', label: 'Total Volume (USDC)' },
              { value: stats ? formatPrice(stats.totalProfitDistributed, 6) : '0', label: 'Profit Distributed' },
              { value: stats?.totalSales || 0, label: 'Total Sales' },
              { value: stats?.activeListings || 0, label: 'Active Listings' },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <div className="text-3xl font-bold font-mono">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border bg-white">
        <motion.div
          className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
           <motion.div variants={fadeInUp} className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#005B41]/10 flex items-center justify-center text-[#005B41]">
               <RefreshCw size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-foreground">Profit Loop Algorithm</div>
               <div className="text-sm text-gray-500">Auto-distribution to 5 generations</div>
             </div>
           </motion.div>

           <motion.div variants={fadeInUp} className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#005B41]/10 flex items-center justify-center text-[#005B41]">
               <ShieldCheck size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-foreground">Verified Ownership</div>
               <div className="text-sm text-gray-500">Blockchain-backed history</div>
             </div>
           </motion.div>

           <motion.div variants={fadeInUp} className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#005B41]/10 flex items-center justify-center text-[#005B41]">
               <BadgeDollarSign size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-foreground">Instant Payouts</div>
               <div className="text-sm text-gray-500">USDC sent directly to your wallet</div>
             </div>
           </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">How the Profit Loop Works</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Every car you own becomes a passive income asset. Here's how you earn from every future resale.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {/* Step 1 */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative bg-white rounded-2xl p-8 shadow-sm border border-border"
            >
              <div className="absolute -top-4 left-8 w-8 h-8 bg-[#008170] text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="w-16 h-16 bg-[#008170]/10 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingCart className="text-[#008170]" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Buy or Mint</h3>
              <p className="text-gray-600">
                Purchase a car NFT from the marketplace or mint a new one. You're now part of the ownership chain.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative bg-white rounded-2xl p-8 shadow-sm border border-border"
            >
              <div className="absolute -top-4 left-8 w-8 h-8 bg-[#008170] text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="w-16 h-16 bg-[#008170]/10 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="text-[#008170]" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Sell & Profit</h3>
              <p className="text-gray-600">
                List your car at any price. When it sells, you keep 100% of the sale profit minus a small platform fee.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative bg-white rounded-2xl p-8 shadow-sm border border-border"
            >
              <div className="absolute -top-4 left-8 w-8 h-8 bg-[#008170] text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="w-16 h-16 bg-[#008170]/10 rounded-2xl flex items-center justify-center mb-6">
                <Coins className="text-[#008170]" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Earn Forever</h3>
              <p className="text-gray-600">
                Every time the car is resold (up to 5 generations), you automatically receive a share of the profit in USDC.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Profit Calculator */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008170]/10 text-[#008170] text-sm font-medium mb-4">
              Earnings Calculator
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">See Your Potential Earnings</h2>
            <p className="text-xl text-gray-500">
              Enter a purchase price to see how much you could earn from future resales
            </p>
          </motion.div>

          <motion.div
            className="bg-gray-50 rounded-2xl p-8 border border-border"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Purchase Price (USDC)
              </label>
              <input
                type="number"
                value={calcPrice}
                onChange={(e) => setCalcPrice(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#008170] focus:outline-none"
                placeholder="10000"
              />
            </div>

            <div className="space-y-3 mb-8">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Projected Earnings (assuming 20% appreciation per sale)
              </div>
              {projectedEarnings.map((earning, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-[#008170] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-gray-600">Resale #{i + 1}</span>
                  </div>
                  <span className="font-mono font-bold text-green-600">
                    +${earning.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#008170] text-white rounded-xl p-6 text-center">
              <div className="text-sm text-white/80 mb-1">Total Potential Earnings</div>
              <div className="text-4xl font-bold font-mono">${totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-white/80 mt-2">
                From a ${parseFloat(calcPrice || '0').toLocaleString()} investment
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Recent Activity */}
      {recentSales.length > 0 && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
                Live Activity
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-2">Recent Sales</h2>
              <p className="text-gray-500">Real transactions happening on ReLoop</p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {recentSales.map((sale) => (
                <motion.div
                  key={sale.id}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#008170]/10 rounded-lg flex items-center justify-center">
                      <Users className="text-[#008170]" size={24} />
                    </div>
                    <div>
                      <div className="font-medium">
                        {sale.metadata?.name || `Token #${sale.tokenId}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatAddress(sale.buyer)} bought from {formatAddress(sale.seller)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono">${formatPrice(sale.price, 6)}</div>
                    {BigInt(sale.profit) > 0n && (
                      <div className="text-sm text-green-600">
                        +${formatPrice(sale.profit, 6)} distributed
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-24 px-6 bg-[#0F0F0F] text-white">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl sm:text-5xl font-bold mb-6"
          >
            Ready to Start Earning?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Join the future of car ownership. Every sale creates value for everyone in the chain.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/marketplace"
              className="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              Browse Marketplace
            </Link>
            {isConnected ? (
              <Link
                to="/create"
                className="px-8 py-4 rounded-xl font-medium border border-white/20 hover:bg-white/10 transition-colors"
              >
                Mint Your Car
              </Link>
            ) : (
              <Link
                to="/portfolio"
                className="px-8 py-4 rounded-full font-medium border border-white/20 hover:bg-white/10 transition-colors"
              >
                Connect Wallet
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
