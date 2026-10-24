import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  define: {
    'process.env': {},
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/image': path.resolve(__dirname, './components/ui/ImageAdapter.tsx'),
      'next/link': path.resolve(__dirname, './components/ui/LinkAdapter.tsx'),
      'next/navigation': path.resolve(__dirname, './lib/navigation/NavigationAdapter.tsx'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
