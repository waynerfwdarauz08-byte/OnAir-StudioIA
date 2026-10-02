import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { projectionsApiPlugin } from "./dev/projectionsApi.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");

  return {
    plugins: [
      react(),
      projectionsApiPlugin({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_PROJECTIONS_MODEL || "gemini-3.1-flash-lite",
      }),
    ],

    server: {
      proxy: {
        "/n8n": {
          target: "http://localhost:5678",
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(/^\/n8n/, ""),
        },
      },
    },
  };
});
