import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function paymentApiPlugin() {
  return {
    name: 'payment-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/payments/')) {
          return next()
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {}
            let result

            const authHeader = req.headers['authorization'] || ''
            if (req.url === '/api/payments/create-order') {
              const { handleCreateOrder } = await import('./server/paymentServer.js')
              result = await handleCreateOrder(parsed, authHeader)
            } else if (req.url === '/api/payments/verify-payment') {
              const { handleVerifyPayment } = await import('./server/paymentServer.js')
              result = await handleVerifyPayment(parsed, authHeader)
            } else if (req.url === '/api/payments/test-payment') {
              const { handleTestPayment } = await import('./server/paymentServer.js')
              result = await handleTestPayment(parsed, authHeader)
            } else {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }))
              return
            }

            res.statusCode = result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.body))
          } catch (err) {
            console.error('[Vite Payment Middleware Error]', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      tailwindcss(),
      react(),
      paymentApiPlugin(),
    ],
  }
})
