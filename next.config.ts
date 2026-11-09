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
      'onnxruntime-node': './empty.js',
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