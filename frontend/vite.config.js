import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run dev` usa el backend normal (5000).
// `npm run dev:pruebas` (modo "pruebas") usa el backend de la base de pruebas local (5001),
// así los dos pueden correr a la vez.
export default defineConfig(({ mode }) => {
  const pruebas = mode === 'pruebas'
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: pruebas ? 3001 : 3000,
      strictPort: pruebas,
      proxy: {
        '/api': {
          target: pruebas ? 'http://localhost:5001' : 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  }
})
