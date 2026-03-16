import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/Cortana-MultiModal-Live-Agent/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        'import.meta.env.VITE_CLOUD_PERSIST_ENDPOINT': JSON.stringify(env.VITE_CLOUD_PERSIST_ENDPOINT || ''),
        'import.meta.env.VITE_CLOUD_PERSIST_API_KEY': JSON.stringify(env.VITE_CLOUD_PERSIST_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
