import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/dist/**', '**/*.html', '**/*.txt', '**/*.xml', '**/*.cjs', '**/*.py', '**/temp*/**', '**/node_modules/**']
    }
  },
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://evvbhalgyffagsesmvhu.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmJoYWxneWZmYWdzZXNtdmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Nzc2MDMsImV4cCI6MjA4OTQ1MzYwM30.gL5FtiWtgIDLWXQJZnWbaOK9XY4voUQrfFLf5EaA2v4'),
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', 'zustand', 'react-helmet-async'],
    alias: [
      { find: /^react$/, replacement: path.resolve(process.cwd(), 'node_modules/react') },
      { find: /^react-dom$/, replacement: path.resolve(process.cwd(), 'node_modules/react-dom') },
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      'react-router',
      'react-router-dom',
      'react-helmet-async',
      'zustand',
      'zustand/middleware',
      'lucide-react',
      'react-hot-toast',
      'axios',
      'clsx',
      'tailwind-merge',
      '@supabase/supabase-js',
      '@hello-pangea/dnd',
      'dompurify',
      'react-easy-crop',
      'react-simple-wysiwyg',
      'swr',
    ],
  },
});
