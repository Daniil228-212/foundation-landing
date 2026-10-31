import type { NextConfig } from "next";

// STATIC_EXPORT=1 — статическая сборка с относительными путями (превью-хостинг без сервера)
const exportMode = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = exportMode
  ? { output: "export", images: { unoptimized: true } }
  : {};

export default nextConfig;
