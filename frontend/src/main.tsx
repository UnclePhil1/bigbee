import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";

createRoot(document.getElementById("root")!).render(
  <SolanaWalletProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </SolanaWalletProvider>
);
