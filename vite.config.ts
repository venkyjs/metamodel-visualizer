import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point to the source files for hot reloading during development
      'react-graph-tree': path.resolve(__dirname, 'packages/react-graph-tree/src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    // Watch the packages directory for changes
    watch: {
      // Include packages in the watch
    },
  },
  // Ensure packages are processed by Vite
  optimizeDeps: {
    include: ['@xyflow/react', 'dagre'],
    // Don't pre-bundle our local package
    exclude: ['react-graph-tree'],
  },
})
