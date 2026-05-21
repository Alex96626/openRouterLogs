import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/proxy/user-profile': {
        target: 'https://api.k8s.cloud.bfl-soft.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/user-profile/, '/user-profile'),
      },
    },
  },
})
