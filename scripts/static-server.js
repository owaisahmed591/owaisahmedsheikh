const fs = require('fs');
const http = require('http');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || '127.0.0.1';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function resolveRequest(urlPath) {
  let requestPath = decodeURIComponent(urlPath.split('?')[0]);
  if (requestPath.endsWith('/')) requestPath += 'index.html';
  if (!path.extname(requestPath)) requestPath += '/index.html';

  const filePath = path.resolve(root, requestPath.replace(/^\/+/, ''));
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

function send(res, status, filePath, body) {
  res.writeHead(status, {
    'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handleAiAssistant(req, res) {
  globalThis.Netlify = {
    env: {
      get: key => process.env[key] || ''
    }
  };

  const functionUrl = pathToFileURL(path.join(root, 'netlify', 'functions', 'ai-assistant.mts')).href;
  const mod = await import(functionUrl);
  const body = ['GET', 'HEAD'].includes(req.method || '') ? undefined : await readRequestBody(req);
  const request = new Request(`http://${host}:${port}${req.url || '/api/ai-assistant'}`, {
    method: req.method,
    headers: req.headers,
    body
  });
  const response = await mod.default(request);
  const responseBody = Buffer.from(await response.arrayBuffer());
  const headers = {};

  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  res.writeHead(response.status, headers);
  res.end(responseBody);
}

const server = http.createServer((req, res) => {
  if ((req.url || '').split('?')[0] === '/api/ai-assistant') {
    handleAiAssistant(req, res).catch(() => {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({
        answer: 'I can help with SEO audits, local SEO, technical SEO, content writing, pricing, and the best next step for your website. Tell me your business type, city, website URL, and what you want to improve.',
        mode: 'fallback'
      }));
    });
    return;
  }

  const filePath = resolveRequest(req.url || '/');
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, body) => {
    if (!error) {
      send(res, 200, filePath, body);
      return;
    }

    const notFound = path.join(root, '404.html');
    fs.readFile(notFound, (notFoundError, notFoundBody) => {
      if (notFoundError) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      send(res, 404, notFound, notFoundBody);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Local preview running at http://${host}:${port}/`);
});
