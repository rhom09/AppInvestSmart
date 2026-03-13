import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo-192.png', 'logo-512.png'],
      manifest: {
        name: 'InvestSmart',
        short_name: 'InvestSmart',
        description: 'Análise e acompanhamento de investimentos brasileiros',
        theme_color: '#0f1629',
        background_color: '#0f1629',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
  }
})
