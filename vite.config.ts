import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import process from "node:process";

console.log("=========================================");
console.log("LOADING VITE CONFIG - CLOUDFLARE VERSION");
console.log("CWD:", process.cwd());
console.log("ENV NITRO_PRESET:", process.env.NITRO_PRESET);
console.log("ENV VERCEL:", process.env.VERCEL);
console.log("ENV CF_PAGES:", process.env.CF_PAGES);
console.log("=========================================");

export default defineConfig({
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core"
    ]
  },
  css: {
    transformer: "lightningcss"
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"]
        }
      },
      server: { entry: "server" }
    }),
    nitro({
      preset: "cloudflare-module"
    }),
    react()
  ]
});
