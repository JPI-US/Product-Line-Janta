import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getLovablePreviewOrigin } from "./src/lib/lovablePreviewOrigin";

const lovablePreviewOrigin = getLovablePreviewOrigin();

export default defineConfig({
  plugins: [react()],
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/__l5e": {
        target: lovablePreviewOrigin,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "::",
    port: 8080,
    proxy: {
      "/__l5e": {
        target: lovablePreviewOrigin,
        changeOrigin: true,
      },
    },
  },
});
