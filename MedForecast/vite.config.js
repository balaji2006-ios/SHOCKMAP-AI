import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: { allowedHosts: [ 'localhost', '127.0.0.1', 'interdestructive-kiera-archipelagic.ngrok-free.dev' // add your ngrok domain here 
  ] },
  plugins: [react()],
})
