const { API_HOST: rawApiHost, TOKEN_KEY, DOMAIN, PORT, TOKEN_MAX_AGE, MQTT_URL, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPIC_AWB_SYNC_UPDATED, HOST_PRINTER, FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID, FIREBASE_VAPID_KEY } = process.env
const API_HOST = rawApiHost?.replace(/\/+$/, '');
// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { appConfig } from "./config/app";
import { i18nConfig } from "./config/i18n";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Auto imports & components configuration
  imports: {
    dirs: ['composables', 'utils', 'services', 'stores'],
  },
  components: true,

  // Modules
  modules: ["@pinia/nuxt", "@vee-validate/nuxt", "@nuxtjs/i18n"],

  // i18n configuration
  i18n: i18nConfig,

  // Disable sourcemaps for production build to save memory and avoid warnings
  sourcemap: {
    server: false,
    client: false
  },

  // CSS
  css: ["~/assets/css/main.css", "@vuepic/vue-datepicker/dist/main.css"],

  // Vite plugins
  vite: {
    plugins: [tailwindcss()],
  },

  // Runtime config for API
  runtimeConfig: {
    // Private keys (server-side only)
    apiSecret: "",

    // Public keys (exposed to client)
    public: {
      // Frontend calls /api/* which gets proxied to /v1/*
      apiBase: "/api",
      tokenKey: TOKEN_KEY || "access_token",
      tokenMaxAge: Number(TOKEN_MAX_AGE) || 604800, // 7 days in seconds
      mqttUrl: MQTT_URL || "ws://localhost:9001",
      mqttUsername: MQTT_USERNAME || "",
      mqttPassword: MQTT_PASSWORD || "",
      mqttTopicAWBSyncUpdated: MQTT_TOPIC_AWB_SYNC_UPDATED || "cargo/awb/sync/updated",
      firebaseApiKey: FIREBASE_API_KEY || '',
      firebaseAuthDomain: FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: FIREBASE_APP_ID || '',
      firebaseMeasurementId: FIREBASE_MEASUREMENT_ID || '',
      firebaseVapidKey: FIREBASE_VAPID_KEY || '',
      hostPrinter: HOST_PRINTER || 'http://localhost:8085',
      publicRoutes: [
        "/login", 
        "/register", 
        "/forgot-password", 
        "/reset-password", 
        "/transaction/booking",
        "/logout", 
      ],
    },
  },

  // Nitro server configuration with API proxy
  nitro: {
    // Development proxy - rewrites /api to /v1
    devProxy: {
      "/api": {
        target: `${API_HOST}/api`,
        changeOrigin: true,
      },
    },

    // Production route rules - rewrites /api to /v1
    routeRules: {
      // /api/users → http://localhost:8080/v1/users
      "/api/**": {
        proxy: `${API_HOST}/v1/**`,
      },
    },
  },

  // Route rules for caching
  routeRules: {
    // Static pages - prerender
    "/login": { prerender: true },
  },

  // App configuration
  app: appConfig,

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false,
  },

  experimental: {
    appManifest: false,
  },
});
