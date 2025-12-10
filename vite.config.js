import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Unocss from "unocss/vite";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import eslintPlugin from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  // ✅ Vercel requires root base, not /Piped/
  base: "/",

  plugins: [
    vue(),
    Unocss(),
    VueI18nPlugin({
      include: path.resolve(__dirname, "./src/locales/**"),
    }),

    VitePWA({
      registerType: "autoUpdate",

      // ✅ PWA base must match Vercel root
      base: "/",

      workbox: {
        globPatterns: [
          "**/*.{css,html,js}",
          "manifest.webmanifest",
        ],
        runtimeCaching: [
          {
            urlPattern: /https:\/\/[a-zA-Z./0-9_]*\.(?:otf|ttf)/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },

      manifest: {
        name: "Piped",
        short_name: "Piped",
        background_color: "#000000",
        theme_color: "#fa4b4b",
        icons: [
          { src: "./img/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "./img/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ]
      }
    }),

    eslintPlugin(),
  ],

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  }
});
