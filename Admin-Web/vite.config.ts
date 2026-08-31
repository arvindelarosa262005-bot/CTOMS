import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const certDir = 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\certs'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    https: {
      key: fs.readFileSync(`${certDir}\\ctoms.key`),
      cert: fs.readFileSync(`${certDir}\\ctoms.crt`)
    },
    proxy: {
      '/api': {
        target: 'https://192.168.8.142:7000',
        changeOrigin: true,
        secure: false
      },
      '/hubs': {
        target: 'https://192.168.8.142:7000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
