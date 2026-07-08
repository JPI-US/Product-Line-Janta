import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const ANALYZE = process.env.ANALYZE === "1" || process.env.ANALYZE === "true";

export default defineConfig({
  plugins: [
    react(),
    ANALYZE &&
      visualizer({
        filename: "dist/stats.html",
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
  ].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "::",
    port: 8080,
  },
  build: {
    // Warn later — three-vendor legitimately exceeds default 500 KB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vite's dynamic-import preload helper is shared by every chunk;
          // left alone Rollup hoists it into three-vendor, dragging ~240 KB
          // of 3D runtime into the entry graph. Pin it to its own chunk.
          if (id.includes("vite/preload-helper")) {
            return "preload-helper";
          }

          if (!id.includes("node_modules")) return undefined;

          // Draco / KTX2 / meshopt decoders — only pulled in when a compressed
          // GLB actually references them; keep them separate so route bundles
          // don't drag the decoder wasm eagerly. three-stdlib itself must live
          // in three-vendor: drei imports it statically, and splitting it out
          // creates a circular chunk pair that breaks module init order (TDZ).
          if (
            id.includes("three/examples/jsm/libs/draco") ||
            id.includes("three/examples/jsm/libs/ktx2") ||
            id.includes("three/examples/jsm/libs/meshopt")
          ) {
            return "three-loaders";
          }
          if (id.includes("three-stdlib")) {
            return "three-vendor";
          }

          // Post-processing stack — only used by product/orbit canvases.
          if (
            id.includes("@react-three/postprocessing") ||
            id.includes("node_modules/postprocessing")
          ) {
            return "three-postfx";
          }

          // Core 3D vendor — three, r3f, drei. Shared across every product page
          // and the marketing hero, so long-term caching wins.
          if (
            id.includes("/three/") ||
            id.includes("@react-three/fiber") ||
            id.includes("@react-three/drei")
          ) {
            return "three-vendor";
          }

          // React runtime — stable, cache forever
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }

          if (id.includes("react-router")) {
            return "router-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
