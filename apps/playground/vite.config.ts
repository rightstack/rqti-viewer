import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/qms-api": {
        target: "https://stgqms.mirae-n.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/qms-api/, ""),
      },
    },
  },
});
