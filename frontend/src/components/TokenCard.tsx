import { Link } from 'react-router-dom';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import type { Listing } from '../mocks/types'; // Assuming types are exported from here



interface TokenCardProps {
  listing: Listing;
}

export function TokenCard({ listing }: TokenCardProps) {
  const { token } = listing;

  return (
    <Link 
      to={`/asset/${token.id}`}
      className="group bg-surface rounded-xl overflow-hidden border border-border hover:border-gray-300 hover:shadow-lg transition-all duration-300"
    >
      {/* Image Container */}
      <div className="aspect-[16/10] overflow-hidden relative bg-gray-100">
        <img 
          src={token.image} 
          alt={token.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Cascade Badge */}
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded-md border border-gray-200 shadow-sm flex items-center gap-1.5">
          <ArrowLeftRight size={14} className="text-highlight" />
          <span className="text-foreground">Loop Enabled</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
            {token.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded">Gen {token.depth}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
             <CheckCircle2 size={12} className="text-highlight" /> Verified
          </span>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Price</div>
            <div className="text-xl font-bold font-mono tracking-tight text-foreground">
              ${listing.price.toLocaleString()}
            </div>
          </div>
          
          <div className="text-accent text-sm font-medium hover:underline">
            View Details →
          </div>
        </div>
      </div>
    </Link>
  );
}
