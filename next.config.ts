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
    '@huggingface/transformers',
  ],
  turbopack: {
    resolveAlias: {
      // Force Turbopack to use the browser/WASM version instead of native node
      'onnxruntime-node': 'onnxruntime-web', 
    },
  },
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
    ],
  },
};

export default nextConfig;