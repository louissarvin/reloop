import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, ShieldCheck, Tag } from 'lucide-react';
import { MockService } from '../mocks/service';
import type { Listing } from '../mocks/types';
import { CascadeVisualizer } from '../components/CascadeVisualizer';

export function Detail() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  
  useEffect(() => {
    if (id) {
       MockService.getListingById(id).then(setListing);
    }
  }, [id]);

  if (listing === undefined) return <div className="p-20 text-center text-gray-500">Loading asset...</div>;
  if (listing === null) return <div className="p-20 text-center">Asset not found</div>;

  const { token } = listing;

  const handleBuy = async () => {
    alert("Buying is simulated in Mock Mode. Check console.");
    await MockService.buyToken(listing.tokenId);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-7 space-y-8">
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-border">
            <img 
               src={token.image} 
               alt={token.name} 
               className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">{token.name}</h1>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700">
                <ShieldCheck size={16} className="text-highlight" />
                Verified Ownership
              </div>
              <div className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700">
                <Tag size={16} className="text-highlight" />
                Resale Loop Active
              </div>
            </div>

            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {token.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Price Component */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm sticky top-24">
             <div className="flex items-start justify-between mb-6">
               <div>
                  <div className="text-sm text-gray-500 font-medium mb-1">Current Price</div>
                  <div className="text-4xl font-bold font-mono text-foreground">
                    ${listing.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    + $450 Est. Fees
                  </div>
               </div>
               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                 <Share2 size={20} />
               </button>
             </div>

             <button 
               onClick={handleBuy}
               className="w-full bg-foreground text-background font-semibold py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all mb-4 shadow-lg shadow-gray-200"
             >
               Buy Now
             </button>
             
             <p className="text-xs text-center text-gray-400">
               Secured by ReLoop Smart Contracts.
             </p>

             <hr className="my-6 border-gray-100" />

             {/* Cascade Visualization */}
             <CascadeVisualizer splits={token.splits} depth={token.depth} />

          </div>
        </div>
      </div>
    </div>
  );
}
