import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // The backend only allows browser calls from https://mycommuniti.org, so in development
    // src/lib/api calls /api/... on this origin and Vite forwards it (see src/lib/api/client.ts).
    proxy: {
      '/api': {
        target: 'https://api.mycommuniti.org',
        changeOrigin: true,
        // Let the refresh-token cookie be stored for localhost.
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
