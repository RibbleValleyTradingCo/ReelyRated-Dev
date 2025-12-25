import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const shouldAnalyze = process.env.ANALYZE === "1";
  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Build optimizations (BUILD-001)
  build: {
    // Enable minification with esbuild (faster than terser)
    minify: "esbuild",

    // Target ES2020 for better browser compatibility
    target: "es2020",

    // Generate source maps for production debugging
    sourcemap: true,

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Warn about large chunks (500kb)
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      plugins: shouldAnalyze
        ? [
            visualizer({
              filename: "dist/stats.html",
              gzipSize: true,
              brotliSize: true,
              template: "treemap",
            }),
            visualizer({
              filename: "dist/stats.json",
              template: "raw-data",
            }),
          ]
        : [],
      output: {
        // Simpler chunk splitting that won't break React
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.match(/node_modules\/react(\/|$)/)) {
            return "vendor-react";
          }
          if (id.includes("react-router")) {
            return "vendor-router";
          }
          if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-")) {
            return "vendor-query";
          }
          if (id.includes("@supabase/auth-js")) {
            return "vendor-supabase-auth";
          }
          if (id.includes("@supabase/")) {
            return "vendor-supabase";
          }
          if (id.includes("html2canvas")) {
            return "vendor-html2canvas";
          }
          if (id.includes("zod")) {
            return "vendor-zod";
          }
          if (id.includes("react-hook-form")) {
            return "vendor-forms";
          }
          if (id.includes("react-day-picker") || id.includes("date-fns")) {
            return "vendor-date";
          }
          if (id.includes("@nivo") || id.includes("recharts")) {
            return "vendor-charts";
          }
          if (id.includes("@react-spring")) {
            return "vendor-spring";
          }
          if (id.includes("@floating-ui")) {
            return "vendor-floating";
          }
          if (id.includes("lodash")) {
            return "vendor-lodash";
          }
          if (
            id.includes("react-markdown") ||
            id.includes("remark") ||
            id.includes("rehype") ||
            id.includes("unified") ||
            id.includes("mdast") ||
            id.includes("micromark") ||
            id.includes("hast")
          ) {
            return "vendor-markdown";
          }
          if (
            id.includes("@radix-ui") ||
            id.includes("lucide-react") ||
            id.includes("cmdk")
          ) {
            return "vendor-ui";
          }
          return "vendor";
        },

        // Consistent chunk naming for better caching
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  // Dependency optimization
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
    ],

    // Exclude problematic dependencies from pre-bundling
    exclude: ["lovable-tagger"],
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.ts",
    css: false,
    exclude: ["tests/**", "**/node_modules/**", "**/dist/**"],
  },
  };
});
