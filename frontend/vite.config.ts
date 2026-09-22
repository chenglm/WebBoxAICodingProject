/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// During local development the SPA calls the Spring Boot API through a proxy so
// the HTTP-only session cookie stays first-party. The target can be overridden
// with VITE_DEV_API_TARGET (defaults to the local backend on port 8080).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8080';
  const apiBase = env.VITE_API_BASE_URL || '/api';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        [apiBase]: {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
