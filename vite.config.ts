import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build also loads from file:// inside the desktop app.
  base: './',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
