// RF1 — Optional Local Node.js HTTP Server & Proxy
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const simulator = require('../js/simulator');
const openf1 = require('../js/openf1');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

let activeMode = 'SIM';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  try {
    if (pathname === '/api/session') {
      sendJson(res, 200, {
        sessionName: activeMode === 'SIM' ? 'Silverstone GP (Sim)' : 'Abu Dhabi GP 2024',
        mode: activeMode
      });
      return;
    }

    if (pathname === '/api/toggle-mode') {
      activeMode = activeMode === 'SIM' ? 'LIVE' : 'SIM';
      sendJson(res, 200, { mode: activeMode });
      return;
    }

    if (pathname === '/api/drivers') {
      sendJson(res, 200, simulator.getDrivers());
      return;
    }

    if (pathname === '/api/telemetry') {
      const driverNum = parsedUrl.searchParams.get('driver') || 4;
      if (activeMode === 'SIM') {
        sendJson(res, 200, simulator.getDriverTelemetry(driverNum));
      } else {
        const telem = await openf1.getTelemetry(driverNum);
        sendJson(res, 200, telem);
      }
      return;
    }

    if (pathname === '/api/leaderboard') {
      sendJson(res, 200, simulator.getLeaderboard());
      return;
    }

    serveStatic(req, res, pathname);
  } catch (err) {
    console.error('[RF1 Server Error]', err);
    sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[RF1] Running at http://localhost:${PORT}`);
});
