import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' para que el build funcione en cualquier ruta (intranet, SharePoint, servidor Node).
// El paquete principal incluye la base inicial de datos (seed.json, ~300 kB); los módulos se cargan bajo demanda.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 800 },
  test: { environment: 'jsdom' },
});
