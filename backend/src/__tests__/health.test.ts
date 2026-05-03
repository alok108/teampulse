import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import Fastify, { type FastifyInstance } from 'fastify'
import { healthRoutes } from '../routes/health.js'

describe('Health endpoint', () => {
  let app: FastifyInstance

  before(async () => {
    app = Fastify()
    await app.register(healthRoutes)
    await app.ready()
  })

  after(async () => {
    await app.close()
  })

  it('GET /health returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    assert.equal(res.statusCode, 200)
    const body = res.json()
    assert.equal(body.status, 'ok')
    assert.equal(body.version, '1.0.0')
    assert.ok(body.timestamp)
  })

  it('returns ISO 8601 timestamp', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    const body = res.json()
    assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
