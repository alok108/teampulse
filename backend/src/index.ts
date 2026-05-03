import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import { authHook } from './plugins/auth.js'
import { healthRoutes } from './routes/health.js'
import { taskRoutes } from './routes/tasks.js'
import { meetingRoutes } from './routes/meetings.js'
import { reviewRoutes } from './routes/reviews.js'
import { insightRoutes } from './routes/insights.js'

const app = Fastify({ logger: true })

app.setErrorHandler((err, req, reply) => {
  req.log.error({ err }, 'request failed')
  const status = err.statusCode ?? 500
  reply.status(status).send({
    error: err.message,
    code: (err as { code?: string }).code ?? null,
  })
})

await app.register(cors, { origin: true })
await app.register(healthRoutes)

await app.register(async (api) => {
  api.addHook('preHandler', authHook)
  await api.register(taskRoutes)
  await api.register(meetingRoutes)
  await api.register(reviewRoutes)
  await api.register(insightRoutes)
}, { prefix: '/api' })

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
  console.log(`TeamPulse backend running on port ${config.port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
