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
    'tesseract.js-core',
    'bmp-js',
    '@napi-rs/canvas',
  ],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/bmp-js/**/*',
      './node_modules/@napi-rs/canvas/**/*',
      './node_modules/@napi-rs/canvas-linux-x64-gnu/**/*',
    ],
  },
};

export default nextConfig;