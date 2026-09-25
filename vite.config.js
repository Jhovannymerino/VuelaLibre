import { defineConfig } from "vite";

const backendPort = process.env.BACKEND_PORT || 8787;

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
