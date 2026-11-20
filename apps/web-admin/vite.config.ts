import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const backend = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

/** Admin và API cùng nguồn gốc qua proxy → cookie phiên httpOnly hoạt động. */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': backend, '/storage': backend } },
});
