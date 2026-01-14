import { useEffect, useState } from 'react';
import type { User } from '../mocks/types';
import { MockService } from '../mocks/service';
import { BadgeDollarSign, CarFront } from 'lucide-react';

export function Portfolio() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    MockService.getUser().then(setUser);
  }, []);

  if (!user) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">My Garage</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Balance</div>
          <div className="text-3xl font-mono font-bold">${user.balance.toLocaleString()}</div>
        </div>
        
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">Loop Earnings</div>
          <div className="text-3xl font-mono font-bold text-accent flex items-center gap-2">
            <BadgeDollarSign />
            ${user.earnings.toLocaleString()}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Generated from 3 past vehicle sales
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-1">Active Vehicles</div>
          <div className="text-3xl font-mono font-bold flex items-center gap-2">
            <CarFront />
            {user.inventory.length}
          </div>
        </div>
      </div>

      {/* Assets List */}
      <h2 className="text-xl font-bold mb-4">Inventory</h2>
      <div className="bg-surface rounded-2xl border border-border p-8 text-center text-gray-500">
        <p>You haven't bought any cars yet.</p>
        <p className="text-sm mt-2">Visit the marketplace to start your collection.</p>
      </div>
    </div>
  );
}
