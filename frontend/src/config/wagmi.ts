import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { getDefaultConfig } from "connectkit";

// Define Mantle Sepolia chain
export const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MantleScan",
      url: "https://sepolia.mantlescan.xyz",
    },
  },
  testnet: true,
});

// Create wagmi config with ConnectKit
export const config = createConfig(
  getDefaultConfig({
    // Required
    chains: [mantleSepolia],
    transports: {
      [mantleSepolia.id]: http("https://rpc.sepolia.mantle.xyz"),
    },

    // Required API Keys
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",

    // Required App Info
    appName: "ReLoop RWA",

    // Optional App Info
    appDescription: "Real World Asset Marketplace with Profit Cascade",
    appUrl: "https://reloop.app",
    appIcon: "https://reloop.app/logo.png",
  })
);

// Export chain ID for convenience
export const CHAIN_ID = mantleSepolia.id;

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
