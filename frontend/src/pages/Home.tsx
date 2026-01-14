import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TokenCard } from '../components/TokenCard';
import { MockService } from '../mocks/service';
import type { Listing } from '../mocks/types';
import { Loader2, ArrowRight, ShieldCheck, RefreshCw, BadgeDollarSign } from 'lucide-react';

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    title: "Porsche 911 GT3 RS",
    sub: "Featured Asset"
  },
  {
    image: "https://images.unsplash.com/photo-1617704548623-29a19213d2fa?q=80&w=1600&auto=format&fit=crop",
    title: "McLaren 720S",
    sub: "Just Listed"
  },
  {
    image: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    title: "Tesla Roadster",
    sub: "Trending"
  }
];

export function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    MockService.getListings().then(data => {
      setListings(data.slice(0, 3)); // Only show top 3 on home
      setLoading(false);
    });
  }, []);

  // Carousel Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#0F0F0F] text-white pt-20 pb-32 px-6 overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#232D3F] rounded-full blur-[120px] opacity-50 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="w-2 h-2 rounded-full bg-[#008170] animate-pulse" />
              <span className="font-medium text-gray-200">The Future of Resale Value</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
              Buy Cars That <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008170] to-[#005B41]">
                Pay You Back.
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-lg leading-relaxed">
              The first marketplace where ownership history pays dividends. 
              Earn a share of the sale price every time your car is resold.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link 
                to="/marketplace"
                className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                Browse Inventory <ArrowRight size={20} />
              </Link>
              <Link 
                to="/create"
                className="px-8 py-4 rounded-full font-medium border border-white/20 hover:bg-white/10 transition-colors text-white"
              >
                Sell Your Car
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block group cursor-pointer" onClick={nextSlide}>
             <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 aspect-[4/3]">
               {HERO_SLIDES.map((slide, index) => (
                 <div 
                   key={index}
                   className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                     index === currentSlide ? 'opacity-100' : 'opacity-0'
                   }`}
                 >
                   <img 
                     src={slide.image} 
                     alt={slide.title} 
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                   <div className="absolute bottom-6 left-6 right-6 transform transition-transform duration-700 translate-y-0">
                     <div className="text-white/80 text-sm mb-1">{slide.sub}</div>
                     <div className="text-2xl font-bold text-white">{slide.title}</div>
                   </div>
                 </div>
               ))}
             </div>
             
             {/* Decorative Ring */}
             <div className="absolute inset-0 -z-10 border-2 border-[#008170]/30 rounded-3xl rotate-6 scale-105 transition-transform duration-1000 group-hover:rotate-3 group-hover:scale-100" />
          </div>
        </div>
      </section>

      {/* Stats / Trust Bar */}
      <section className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#005B41]/10 flex items-center justify-center text-[#005B41]">
               <RefreshCw size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-foreground">Profit Loop Algorithm</div>
               <div className="text-sm text-gray-500">Auto-distribution to 5 generations</div>
             </div>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#005B41]/10 flex items-center justify-center text-[#005B41]">
               <ShieldCheck size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-foreground">Verified Ownership</div>
               <div className="text-sm text-gray-500">Blockchain-backed history</div>
             </div>
           </div>

           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#005B41]/10 flex items-center justify-center text-[#005B41]">
               <BadgeDollarSign size={24} />
             </div>
             <div>
               <div className="font-bold text-lg text-foreground">Instant Payouts</div>
               <div className="text-sm text-gray-500">USDC sent directly to your wallet</div>
             </div>
           </div>
        </div>
      </section>
    </div>
  );
}
