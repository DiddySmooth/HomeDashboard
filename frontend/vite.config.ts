import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env (including .env.local) so the backend target can be overridden
  // per-machine without touching committed defaults.
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || "http://localhost:8000";

  return {
    plugins: [react()],
    // react-draggable@4.7 (pulled in by react-grid-layout) calls
    // `if (process.env.DRAGGABLE_DEBUG)` on every drag. The browser has no
    // `process` global and Vite only replaces `process.env.NODE_ENV` by
    // default, so the bare `process` reference throws a ReferenceError mid-drag
    // — the drag never starts and the browser selects text instead. Statically
    // replace the flag so the dead `if` branch is stripped.
    define: {
      "process.env.DRAGGABLE_DEBUG": "false",
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          "process.env.DRAGGABLE_DEBUG": "false",
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      // Proxy API calls to the FastAPI backend during development.
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
