import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    'pdf-parse',
    'pdf-to-img',
    'canvas',
    'tesseract.js',
    '@napi-rs/canvas',
  ],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
    ],
  },
};

export default nextConfig;