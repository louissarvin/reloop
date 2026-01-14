
import { ArrowDown, Users } from 'lucide-react';

interface CascadeVisualizerProps {
  splits: number[];
  depth: number;
}

export function CascadeVisualizer({ splits }: CascadeVisualizerProps) {
  // Pad the splits with 0s if less than max depth for visualization consistency
  // or just show active splits
  const activeSplits = splits;

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Users className="text-highlight" size={20} />
        Resale Value Loop
      </h3>
      
      <p className="text-sm text-gray-500 mb-6">
        When this car is resold later, <span className="font-medium text-foreground">{(activeSplits.reduce((a,b)=>a+b,0)).toFixed(0)}%</span> of the sale price flows back to previous owners.
      </p>

      <div className="relative pl-4 space-y-6 before:absolute before:left-[21px] before:top-2 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-highlight before:to-transparent">
        {/* Gen 1 (Seller usually, but in this context it refers to Past Owners) */}
        {activeSplits.map((percent, i) => (
          <div key={i} className="relative flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold z-10 shrink-0">
              {percent}%
            </div>
            
            <div className="flex-1 min-w-0">
               <div className="font-medium text-sm text-foreground">
                 Gen {i + 1} Owner
               </div>
               <div className="text-xs text-gray-500">
                 Receives {percent}% of future resale
               </div>
            </div>
            
            <ArrowDown className="text-gray-300 absolute -bottom-5 left-3 z-0" size={14} />
          </div>
        ))}

        {/* Start Node */}
        <div className="relative flex items-center gap-4 opacity-50">
           <div className="w-2 h-2 rounded-full bg-gray-300 absolute left-[14px]" />
           <div className="pl-9 text-xs text-gray-400 italic">
             Chain continues...
           </div>
        </div>
      </div>
    </div>
  );
}
