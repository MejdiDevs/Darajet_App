import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy AI calls through Vite dev server to avoid CORS
        '/api/ai': {
          target: env.VITE_AI_BASE_URL || 'https://integrate.api.nvidia.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, ''),
          headers: {
            'Authorization': `Bearer ${env.VITE_AI_API_KEY}`,
          },
        },
      },
    },
  }
})
