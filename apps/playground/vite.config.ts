import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const QMS_API_TOKEN = "1786114799~Eg4k3QFE";

export default defineConfig({
  plugins: [react()],
  // 워크스페이스 라이브러리는 pre-bundle 캐시하지 않고 dist를 직접 서빙한다.
  // (그렇지 않으면 viewer를 재빌드해도 dev 서버가 옛 번들을 계속 서빙해 변경이 반영되지 않음)
  optimizeDeps: {
    exclude: ["@rightstack/rqti-viewer"],
    // viewer(dist)는 제외해 직접 서빙하되, viewer가 external로 두는 React(CJS)만
    // pre-bundle 한다. react/jsx-runtime은 CommonJS라 pre-bundle 없이 그대로 서빙되면
    // named export(`jsx` 등)를 제공하지 못해 에러가 난다.
    // 그 외 viewer 의존성(mathlive, radix, lucide 등)은 ESM이라 불필요하고,
    // playground의 직접 의존성이 아니라 여기 include하면 "Failed to resolve" 경고가 난다.
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
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
