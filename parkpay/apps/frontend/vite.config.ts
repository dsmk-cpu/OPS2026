import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    server: {
      proxy: {
        "/parkpay": {
          target: "http://localhost:3000",
          changeOrigin: true,

          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader(
                  "X-API-Key",
                  env.PARKPAY_API_KEY
              );
            });
          },
        },
      },
    },
  };
});
