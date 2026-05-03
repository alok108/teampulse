import type { preHandlerAsyncHookHandler } from 'fastify'
import { verifyIdToken } from '../services/firebaseAuth.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: { uid: string; email?: string }
  }
}

export const authHook: preHandlerAsyncHookHandler = async (req, reply) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header' })
  }
  const token = header.slice('Bearer '.length).trim()
  try {
    const decoded = await verifyIdToken(token)
    req.user = { uid: decoded.uid, email: decoded.email }
  } catch (err) {
    req.log.warn({ err }, 'token verification failed')
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }
}
