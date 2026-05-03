import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ← Quan trọng! Cho phép truy cập từ network
    port: 5173, // Hoặc dùng:
    // host: '},
  },
  define: {
    global: "window", // polyfill biến global
  },
});


