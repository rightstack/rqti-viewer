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
  // workspace 패키지 dist 변경이 Vite prebundle 캐시에 묻히지 않도록
  optimizeDeps: {
    exclude: ["@rightstack/rqti-viewer"],
  },
});
