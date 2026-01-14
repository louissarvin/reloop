import { useState } from 'react';
import { ArrowLeftRight, Car, Upload } from 'lucide-react';
import { MockService } from '../mocks/service';

export function Create() {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    depth: 3,
    splits: [6, 4, 2] // Default
  });

  const [loading, setLoading] = useState(false);

  // Helper to update specific split
  const updateSplit = (index: number, val: number) => {
    const newSplits = [...formData.splits];
    newSplits[index] = val;
    setFormData({ ...formData, splits: newSplits });
  };

  // Changing depth resets splits to defaults
  const handleDepthChange = (d: number) => {
    const newSplits = Array(d).fill(0).map((_, i) => Math.max(1, 4 - i)); // Dummy logic
    setFormData({ ...formData, depth: d, splits: newSplits });
  };

  const totalSplit = formData.splits.reduce((a, b) => a + b, 0);
  const maxSplit = formData.depth * 4;
  const isValid = totalSplit <= maxSplit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await MockService.listToken(formData);
    setLoading(false);
    alert("Listing Created (Mock)!");
  };

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
            <Car size={20} /> Vehicle Details
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
               />
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
             <Upload className="mx-auto text-gray-400 mb-2" />
             <span className="text-sm text-gray-500">Upload Car Photos</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Loop Config */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowLeftRight size={20} className="text-highlight" /> 
              Resale Loop Config
            </h3>
            <div className={`text-sm font-medium px-2 py-0.5 rounded ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                   className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                     formData.depth === d 
                       ? 'bg-foreground text-background border-foreground' 
                       : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                   }`}
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
                      className="w-full text-center px-1 py-1.5 rounded border border-gray-300 text-sm"
                      value={split}
                      onChange={e => updateSplit(i, parseInt(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || !isValid}
          className="w-full bg-foreground text-background font-bold py-4 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Processing...' : 'Create Listing'}
        </button>

      </form>
    </div>
  );
}
