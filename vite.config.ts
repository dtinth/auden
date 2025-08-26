/// <reference types="vite/client" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      // Force fiery to use UMD version instead of ESM to avoid Firebase import issues
      // The ESM version expects Firebase in CommonJS format, but Vite optimizes Firebase
      // to ES modules, causing compatibility issues
      fiery: 'fiery/umd/fiery.js',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          // Bundle fiery with firebase to maintain their interdependency
          firebase: ['firebase', 'fiery'],
          grommet: ['grommet', 'grommet-icons'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  // Support hash routing fallback for SPA
  appType: 'spa',
  define: {
    // Map global to globalThis for Node.js compatibility in browser environment
    // Some legacy libraries (like the original AppInitializer code) expect 'global' to exist
    global: 'globalThis',
  },
})
