import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('dotenv').config({quiet:true});
const { createCloudService } = require('./server/cloud.cjs');
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), {name: 'englishblocks-cloud', configureServer(server) {const preview=process.env.CODESPACE_NAME?`https://${process.env.CODESPACE_NAME}-${server.config.server.port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN||'app.github.dev'}`:'';const cloud=createCloudService({allowedOrigins:[process.env.CLOUD_ALLOWED_ORIGINS,preview].filter(Boolean).join(',')});server.middlewares.use(cloud.middleware);server.httpServer?.once('close',()=>cloud.close());}}],
    base: "./",
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      fs: {deny: ['**/.env*','**/.git/**','**/cloud-data/**','**/sync-data/**','**/*.{sqlite,sqlite-wal,sqlite-shm}']},
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
