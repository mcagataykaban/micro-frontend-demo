import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        billing: {
          external: `Promise.resolve(window.__remotes__?.billing || "http://localhost:5002/assets/remoteEntry.js")`,
          externalType: "promise",
        },
        support: {
          external: `Promise.resolve(window.__remotes__?.support || "http://localhost:5003/assets/remoteEntry.js")`,
          externalType: "promise",
        },
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    modulePreload: false,
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5001,
    strictPort: true,
    cors: true,
  },
});
