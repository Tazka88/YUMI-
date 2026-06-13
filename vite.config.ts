import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Plugin to make CSS non-blocking
const asyncCssPlugin = () => {
  return {
    name: 'async-css',
    transformIndexHtml(html: string) {
      return html.replace(
        /<link([^>]*?)rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*?)>/g,
        `<link$1rel="preload" as="style"$2href="$3"$4 onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link$1rel="stylesheet"$2href="$3"$4></noscript>`
      );
    },
  };
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), asyncCssPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(env.SUPABASE_SERVICE_ROLE_KEY),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'lucide': ['lucide-react'],
            'zustand': ['zustand'],
            'supabase': ['@supabase/supabase-js'],
            'motion': ['framer-motion', 'motion/react', 'motion'],
            'editor': ['react-simple-wysiwyg', 'dompurify'],
            'ui-utils': ['clsx', 'tailwind-merge', 'react-hot-toast'],
            'date-utils': ['date-fns'],
            'image-utils': ['react-easy-crop', 'image-size'],
            'misc': ['react-helmet-async', 'axios']
          }
        }
      }
    }
  };
});
