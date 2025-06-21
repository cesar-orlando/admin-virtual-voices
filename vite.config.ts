import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001/api'),
    'import.meta.env.VITE_SOCKET_URL': JSON.stringify(process.env.VITE_SOCKET_URL || 'http://localhost:3001'),
  },
})
