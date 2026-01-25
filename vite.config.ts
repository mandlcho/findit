import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const repoName = 'findit';
  const isCI = process.env.GITHUB_ACTIONS === 'true';

  return {
    // Default build requires no API keys (Option A).
    base: isCI ? `/${repoName}/` : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
