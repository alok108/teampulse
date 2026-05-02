import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

/**
 * GitHub webhook HMAC signature verification tests.
 * Mirrors the logic in routes/reviews.ts.
 */
function verifyGitHubSignature(payload: string, signature: string | undefined, secret: string): boolean {
  if (!secret) return false
  if (!signature) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

describe('GitHub webhook signature verification', () => {
  const secret = 'test-secret'
  const payload = '{"action":"opened","number":42}'
  const validSig = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')

  it('accepts a valid signature', () => {
    assert.equal(verifyGitHubSignature(payload, validSig, secret), true)
  })

  it('rejects a tampered payload', () => {
    assert.equal(verifyGitHubSignature(payload + 'X', validSig, secret), false)
  })

  it('rejects when signature header is missing', () => {
    assert.equal(verifyGitHubSignature(payload, undefined, secret), false)
  })

  it('rejects when secret is not configured (no bypass)', () => {
    assert.equal(verifyGitHubSignature(payload, validSig, ''), false)
  })

  it('rejects a wrong-secret signature', () => {
    const wrongSig = 'sha256=' + crypto.createHmac('sha256', 'other-secret').update(payload).digest('hex')
    assert.equal(verifyGitHubSignature(payload, wrongSig, secret), false)
  })
})
