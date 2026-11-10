const path = require('path');
const Module = require('module');

// Intercept require calls
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'onnxruntime-node') {
    // Redirect native binary request to the WASM version
    return originalRequire.apply(this, ['onnxruntime-web']);
  }
  return originalRequire.apply(this, arguments);
};

// Start the standard Next.js server
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});