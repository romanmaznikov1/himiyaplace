import { fileURLToPath, URL } from "node:url";
import { defineConfig, runnerImport, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Статическая копия контента в #root при сборке — для поисковиков без JS (Яндекс) и как
 * no-JS-фолбэк (src/lib/seo-markup.ts). Приложение (createRoot) заменяет её при монтировании.
 * Только для build; модуль грузится через runnerImport, чтобы content.ts не стал зависимостью
 * конфига (иначе dev-сервер перезапускался бы на каждую правку текста).
 */
function seoStatic(): Plugin {
  return {
    name: "himiya:seo-static",
    apply: "build",
    async transformIndexHtml(html) {
      const { module } = await runnerImport<typeof import("./src/lib/seo-markup")>(
        fileURLToPath(new URL("./src/lib/seo-markup.ts", import.meta.url)),
        { configFile: false, logLevel: "error" },
      );
      return html.replace("<!--seo-static-->", module.seoMarkup());
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoStatic()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
});
