import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const external = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "mathlive",
  "lucide-react",
  "@radix-ui/react-dialog",
  "@radix-ui/react-slot",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({ rollupTypes: true, tsconfigPath: "./tsconfig.json" }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
      cssFileName: "viewer",
    },
    sourcemap: true,
    rollupOptions: {
      external: (id) => {
        // CSS는 viewer.css에 번들 (mathlive 스타일 포함)
        if (id.endsWith(".css")) return false;
        return external.some((dep) => id === dep || id.startsWith(`${dep}/`));
      },
      output: {
        globals: { react: "React", "react-dom": "ReactDOM" },
      },
    },
  },
});
