
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 3006,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // 1. DISABILITA Source Maps: Impedisce di vedere il codice originale nel browser
    sourcemap: false,
    
    // 2. Minificazione avanzata
    minify: 'esbuild',
    
    // 3. Opzioni per rendere il codice meno leggibile
    rollupOptions: {
      output: {
        // Rimuove commenti e console.log in produzione
        compact: true,
      }
    }
  },
  // Nasconde dettagli sensibili nei log
  logLevel: 'info', 
})
