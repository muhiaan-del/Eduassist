import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    'pdf-parse',
    'pdfjs-dist',
    'pdf-to-png-converter',
    'tesseract.js',
    'tesseract.js-core',
    'bmp-js',
    'wasm-feature-detect', // <-- ADD THIS
  ],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/bmp-js/**/*',
      './node_modules/wasm-feature-detect/**/*', // <-- ADD THIS
      './node_modules/pdfjs-dist/cmaps/**/*',
      './node_modules/pdfjs-dist/standard_fonts/**/*',
      './node_modules/pdfjs-dist/wasm/**/*',
      './node_modules/pdf-to-png-converter/**/*',
    ],
  },
};

export default nextConfig;