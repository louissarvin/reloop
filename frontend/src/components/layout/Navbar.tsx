import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Wallet, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Navbar() {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-colors font-medium text-sm",
          isActive 
            ? "bg-foreground text-background" 
            : "text-gray-500 hover:text-foreground hover:bg-gray-100"
        )}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <img src="/logo.png" alt="ReLoop Logo" className="w-32 h-32 object-contain" />
        </Link>

        {/* Links */}
        <div className="flex items-center gap-2">
          <NavItem to="/marketplace" icon={LayoutGrid} label="Marketplace" />
          <NavItem to="/create" icon={PlusCircle} label="Sell Car" />
          <NavItem to="/portfolio" icon={Wallet} label="My Garage" />
        </div>

        {/* User Status (Mock) */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="font-mono font-medium text-sm">150,000 USDC</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm" />
        </div>
      </div>
    </nav>
  );
}
