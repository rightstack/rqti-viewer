import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const QMS_API_TOKEN = "1786114799~Eg4k3QFE";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/qms-api": {
        target: "https://stgqms.mirae-n.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/qms-api/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Authorization", `Bearer ${QMS_API_TOKEN}`);
          });
        },
      },
    },
  },
});
