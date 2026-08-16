import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Clean proxy handler to silence ECONNREFUSED terminal spam on server restarts
const createProxyConfig = (target) => ({
  target,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('error', (err, _req, res) => {
      if (res && !res.headersSent && typeof res.writeHead === 'function') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend server unavailable', status: 503 }));
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/review': createProxyConfig('http://127.0.0.1:8000'),
      '/reviews': createProxyConfig('http://127.0.0.1:8000'),
      '/github': createProxyConfig('http://127.0.0.1:8000'),
      '/health': createProxyConfig('http://127.0.0.1:8000'),
      '/auth': createProxyConfig('http://127.0.0.1:8000'),
    }
  }
})
