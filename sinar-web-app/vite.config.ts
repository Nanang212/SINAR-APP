import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";
import type { UserConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [sveltekit()],
    server: {
      port: parseInt(env.VITE_PORT) || 5173,
      host: env.VITE_HOST === 'localhost' ? true : env.VITE_HOST || true,
      hmr: {
        overlay: env.VITE_ENABLE_DEBUG === 'true'
      }
    },
    resolve: {
      alias: {
        "@": resolve("./src"),
      }
    },
    build: {
      target: env.VITE_BUILD_TARGET || 'es2022',
      sourcemap: env.VITE_SOURCEMAP === 'true'
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME)
    }
  } satisfies UserConfig;
});
