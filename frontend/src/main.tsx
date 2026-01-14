import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config } from "./config/wagmi";
import { reloopTheme } from "./config/connectkit-theme";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="custom"
          mode="light"
          customTheme={reloopTheme}
          options={{
            embedGoogleFonts: true,
            hideBalance: false,
            hideTooltips: false,
            hideQuestionMarkCTA: true,
            hideNoWalletCTA: false,
            walletConnectName: "Other Wallets",
            disclaimer: (
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                By connecting, you agree to ReLoop's Terms of Service
              </span>
            ),
          }}
        >
          <App />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
