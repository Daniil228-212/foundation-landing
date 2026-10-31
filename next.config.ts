import type { NextConfig } from "next";

// STATIC_EXPORT=1 — статическая сборка (GitHub Pages / превью без сервера).
// NEXT_BASE_PATH — подпуть сайта, например "/foundation-landing" для GitHub Pages.
const exportMode = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = exportMode
  ? { output: "export", basePath, images: { unoptimized: true } }
  : {};

export default nextConfig;
