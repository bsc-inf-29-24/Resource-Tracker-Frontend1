import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const backendProxy = {
  "/api": "http://localhost:3000",
  "/resource-requests": "http://localhost:3000",
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: backendProxy },
  preview: { proxy: backendProxy },
})
