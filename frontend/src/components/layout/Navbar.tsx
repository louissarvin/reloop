import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PlusCircle, Wallet, LayoutGrid } from "lucide-react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { cn } from "../../lib/utils";
import { useUSDCBalance, useUSDCAirdrop, formatUSDC } from "../../contracts";

export function Navbar() {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { data: balance, refetch: refetchBalance } = useUSDCBalance(address);
  const { claimAirdrop, isPending: isAirdropping, isSuccess: airdropSuccess } = useUSDCAirdrop();

  // Refetch balance after successful airdrop
  useEffect(() => {
    if (airdropSuccess) {
      refetchBalance();
    }
  }, [airdropSuccess, refetchBalance]);

  const NavItem = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string;
    icon: React.ComponentType<{ size?: number }>;
    label: string;
  }) => {
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
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tight"
        >
          <img
            src="/logo.png"
            alt="ReLoop Logo"
            className="w-32 h-32 object-contain"
          />
        </Link>

        {/* Links */}
        <div className="flex items-center gap-2">
          <NavItem to="/marketplace" icon={LayoutGrid} label="Marketplace" />
          <NavItem to="/create" icon={PlusCircle} label="Sell Car" />
          <NavItem to="/portfolio" icon={Wallet} label="My Garage" />
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          {isConnected && !airdropSuccess && balance !== undefined && balance === 0n && (
            <button
              onClick={() => claimAirdrop()}
              disabled={isAirdropping}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-highlight/10 text-highlight rounded-lg text-sm font-medium hover:bg-highlight/20 transition-colors disabled:opacity-50"
            >
              {isAirdropping ? 'Claiming...' : 'Get USDC'}
            </button>
          )}
          {isConnected && balance !== undefined && (
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted-foreground">Balance</div>
              <div className="font-mono font-medium text-sm">
                {formatUSDC(balance)} USDC
              </div>
            </div>
          )}
          <ConnectKitButton />
        </div>
      </div>
    </nav>
  );
}
