import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Isolate React for long-term caching. Do NOT force a three chunk —
          // a manual three-vendor chunk makes Rollup park a shared helper in it
          // that the entry then imports, dragging the whole 1.25 MB three bundle
          // into the initial (mobile) load. Left alone, three lands only in the
          // lazy 3D chunks (hero tower on desktop, globe on scroll) and is never
          // fetched on the mobile hero.
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(
              id,
            )
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
});
