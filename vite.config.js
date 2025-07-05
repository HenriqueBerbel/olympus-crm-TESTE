import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        // Aqui passamos a configuração do Tailwind diretamente
        tailwindcss({
          content: [
            "./index.html",
            "./src/**/*.{js,ts,jsx,tsx}",
          ],
          darkMode: 'class', // Coloquei o modo escuro de volta
          theme: {
            extend: {},
          },
          plugins: [],
        }),
        autoprefixer,
      ],
    },
  },
})