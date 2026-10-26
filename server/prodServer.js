/**
 * prodServer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone Production Server for RentX.
 *
 * Capabilities:
 *  1. Serves the payment API (/api/payments/*) with cryptographic Razorpay validation.
 *  2. Serves the built frontend SPA from `dist/` with client-side route fallback to `dist/index.html`.
 *  3. Includes CORS preflight handling, health checks (/api/health), and secure response headers.
 *  4. Zero extra runtime dependencies (uses native Node.js HTTP/fs/crypto).
 *
 * Usage:
 *  - Build frontend: `npm run build`
 *  - Start server:   `npm start` or `node server/prodServer.js`
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import {
  handleCreateOrder,
  handleVerifyPayment,
  handleTestPayment,
} from './paymentServer.js'

const PORT = parseInt(process.env.PORT, 10) || 3001
const DIST_DIR = path.resolve(process.cwd(), 'dist')
const CLIENT_URL = process.env.CLIENT_URL || '*'

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_URL === '*' ? (origin || '*') : CLIENT_URL)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = parsedUrl.pathname
  const origin = req.headers.origin

  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, origin)
    res.statusCode = 204
    res.end()
    return
  }

  // 2. Health check endpoint
  if (pathname === '/api/health') {
    setCorsHeaders(res, origin)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }))
    return
  }

  // 3. Payment API Endpoints
  if (pathname.startsWith('/api/payments/')) {
    setCorsHeaders(res, origin)

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }))
      return
    }

    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', async () => {
      try {
        const parsed = body ? JSON.parse(body) : {}
        const authHeader = req.headers['authorization'] || ''
        let result

        if (pathname === '/api/payments/create-order') {
          result = await handleCreateOrder(parsed, authHeader)
        } else if (pathname === '/api/payments/verify-payment') {
          result = await handleVerifyPayment(parsed, authHeader)
        } else if (pathname === '/api/payments/test-payment') {
          result = await handleTestPayment(parsed, authHeader)
        } else {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, error: 'Payment endpoint not found' }))
          return
        }

        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result.body))
      } catch (err) {
        console.error('[ProdServer Payment Error]', err)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: false, error: err.message || 'Internal server error' }))
      }
    })
    return
  }

  // 4. Static Frontend File Serving (SPA mode)
  if (!fs.existsSync(DIST_DIR)) {
    // If dist doesn't exist yet, return instruction
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.end(`
      <html>
        <head><title>RentX API Server</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2>RentX Payment & API Server is running.</h2>
          <p>Frontend assets not found in <code>dist/</code>. Run <code>npm run build</code> to produce client bundles.</p>
        </body>
      </html>
    `)
    return
  }

  let filePath = path.join(DIST_DIR, pathname)

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403
    res.end('Access Denied')
    return
  }

  // Check if requested static file exists
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    // Cache immutable assets (hashed js/css) for 1 year, others no-cache
    if (pathname.startsWith('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      res.setHeader('Cache-Control', 'no-cache')
    }

    res.statusCode = 200
    res.setHeader('Content-Type', contentType)
    fs.createReadStream(filePath).pipe(res)
    return
  }

  // SPA fallback: serve index.html for all client routes (e.g. /equipment, /dashboard)
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.setHeader('Cache-Control', 'no-cache')
    fs.createReadStream(indexPath).pipe(res)
    return
  }

  res.statusCode = 404
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`[RentX Production Server] Running on http://localhost:${PORT}`)
})

// Graceful termination handling
process.on('SIGTERM', () => {
  console.log('[RentX Production Server] SIGTERM received. Shutting down gracefully...')
  server.close(() => process.exit(0))
})
