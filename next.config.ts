import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/stick-stack",
  images: { unoptimized: true },
};

export default nextConfig;
