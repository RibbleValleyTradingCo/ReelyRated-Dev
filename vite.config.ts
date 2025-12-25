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
    dedupe: ["react", "react-dom"],
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
