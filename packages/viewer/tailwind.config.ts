import type { Config } from "tailwindcss";

const config: Config = {
  prefix: "rtqi",
  corePlugins: {
    preflight: false,
  },
  content: ["./src/**/*.{ts,tsx}"],
};

export default config;
