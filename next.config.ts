import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  serverExternalPackages: [
    'pdf-parse',
    'pdf-to-img',
    'canvas',
    'tesseract.js',
    '@napi-rs/canvas',
    '@xenova/transformers', // <--- This prevents Next.js from bundling the native .so files
  ],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
    ],
  },
};

export default nextConfig;