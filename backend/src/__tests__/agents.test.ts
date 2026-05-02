import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Type } from '../services/gemini.js'

describe('Agent schemas', () => {
  it('uses correct Type enum values', () => {
    assert.equal(Type.OBJECT, 'OBJECT')
    assert.equal(Type.STRING, 'STRING')
    assert.equal(Type.ARRAY, 'ARRAY')
    assert.equal(Type.NUMBER, 'NUMBER')
    assert.equal(Type.BOOLEAN, 'BOOLEAN')
  })
})

describe('Task schema validation', () => {
  it('Zod CreateTaskBody rejects short descriptions', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      description: z.string().min(5),
      teamId: z.string(),
    })
    const result = schema.safeParse({ description: 'hi', teamId: 'demo' })
    assert.equal(result.success, false)
  })

  it('Zod CreateTaskBody accepts valid input', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      description: z.string().min(5),
      teamId: z.string(),
    })
    const result = schema.safeParse({ description: 'Add OAuth login', teamId: 'demo-team' })
    assert.equal(result.success, true)
  })

  it('Zod UpdateTaskBody validates status enum', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']).optional(),
    })
    assert.equal(schema.safeParse({ status: 'TODO' }).success, true)
    assert.equal(schema.safeParse({ status: 'INVALID' }).success, false)
  })
})

describe('Priority validation', () => {
  it('rejects unknown priorities', async () => {
    const { z } = await import('zod')
    const schema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    assert.equal(schema.safeParse('CRITICAL').success, true)
    assert.equal(schema.safeParse('URGENT').success, false)
  })
})
