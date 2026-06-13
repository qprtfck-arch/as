import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works both at a domain root and under a
// GitHub Pages project sub-path (https://<user>.github.io/as/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
