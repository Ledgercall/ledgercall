import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy to the two participants' JSON Ledger APIs so the browser talks same-origin
// (no CORS) and we never embed participant hostnames in the app.
//   /ap/*  -> app-provider JSON API (3975)   — the GP / admin / app-provider LPs
//   /au/*  -> app-user     JSON API (2975)   — the isolated LP
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ap': { target: 'http://localhost:3975', changeOrigin: true, rewrite: p => p.replace(/^\/ap/, '') },
      '/au': { target: 'http://localhost:2975', changeOrigin: true, rewrite: p => p.replace(/^\/au/, '') },
    },
  },
})
