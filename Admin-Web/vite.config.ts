import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const certDir = 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode\\certs'

function loadDevCerts() {
  try {
    const key = `${certDir}\\ctoms.key`
    const cert = `${certDir}\\ctoms.crt`
    if (!fs.existsSync(key) || !fs.existsSync(cert)) return undefined
    return {
      key: fs.readFileSync(key),
      cert: fs.readFileSync(cert)
    }
  } catch {
    return undefined
  }
}

export default defineConfig(({ command }) => {
  const https = command === 'serve' ? loadDevCerts() : undefined

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      ...(https ? { https } : {}),
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
  }
})
