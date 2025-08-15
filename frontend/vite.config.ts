import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@solana/web3.js', '@metaplex-foundation/umi-bundle-defaults'],
  },
  build: {
    rollupOptions: {
      external: ['buffer', 'stream', 'crypto', 'http', 'https', 'url', 'zlib', 'punycode'],
    },
  },
})