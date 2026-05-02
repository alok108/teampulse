import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import { healthRoutes } from './routes/health.js'
import { taskRoutes } from './routes/tasks.js'
import { meetingRoutes } from './routes/meetings.js'
import { reviewRoutes } from './routes/reviews.js'
import { insightRoutes } from './routes/insights.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(healthRoutes)
await app.register(taskRoutes, { prefix: '/api' })
await app.register(meetingRoutes, { prefix: '/api' })
await app.register(reviewRoutes, { prefix: '/api' })
await app.register(insightRoutes, { prefix: '/api' })

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
  console.log(`TeamPulse backend running on port ${config.port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
