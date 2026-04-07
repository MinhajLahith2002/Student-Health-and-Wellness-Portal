import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_PROXY_TARGET = 'http://localhost:5001'

function getOriginFromUrl(value) {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

export default defineConfig(({ mode }) => {
  const envRoot = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, envRoot, '')
  const apiBase = (env.VITE_API_URL || '').trim()
  const proxyTarget =
    (env.VITE_API_PROXY_TARGET || '').trim() ||
    (apiBase ? getOriginFromUrl(apiBase) : '') ||
    DEFAULT_PROXY_TARGET

  console.log(`[vite] Proxying /api requests to ${proxyTarget}`)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
