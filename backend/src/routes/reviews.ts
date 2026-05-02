import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { reviewCode } from '../agents/codeReviewer.js'
import { createCodeReview, listCodeReviews } from '../services/firestore.js'
import { config } from '../config.js'

const DirectReviewBody = z.object({
  code: z.string().min(10),
  language: z.string().optional().default('unknown'),
  teamId: z.string(),
  linkedTaskId: z.string().nullable().optional().default(null),
})

function verifyGitHubSignature(payload: string, signature: string | undefined): boolean {
  if (!config.githubWebhookSecret) return false
  if (!signature) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', config.githubWebhookSecret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function reviewRoutes(app: FastifyInstance) {
  // POST /reviews — direct code review (paste code snippet)
  app.post('/reviews', async (req, reply) => {
    const body = DirectReviewBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { code, language, teamId, linkedTaskId } = body.data
    const input = `Language: ${language}\n\n${code}`
    const result = await reviewCode(input)

    const review = await createCodeReview({
      teamId,
      repoName: 'direct-review',
      prNumber: 0,
      prUrl: '',
      qualityScore: result.qualityScore,
      status: 'DONE',
      issues: result.issues,
      overallFeedback: result.overallFeedback,
      linkedTaskId: linkedTaskId ?? null,
    })

    return reply.status(201).send({ data: { ...review, securityFlags: result.securityFlags } })
  })

  // POST /reviews/webhook — GitHub webhook
  app.post('/reviews/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const signature = req.headers['x-hub-signature-256'] as string | undefined
    const rawBody = (req as { rawBody?: Buffer }).rawBody?.toString() ?? JSON.stringify(req.body)

    if (!verifyGitHubSignature(rawBody, signature)) {
      return reply.status(401).send({ error: 'Invalid signature' })
    }

    const payload = req.body as {
      action?: string
      pull_request?: {
        number: number
        html_url: string
        head: { ref: string }
      }
      repository?: { full_name: string }
    }

    if (payload.action !== 'opened' && payload.action !== 'synchronize') {
      return { data: { skipped: true, reason: 'Not a PR open/sync event' } }
    }

    const prNumber = payload.pull_request?.number ?? 0
    const prUrl = payload.pull_request?.html_url ?? ''
    const repoName = payload.repository?.full_name ?? 'unknown'

    // Placeholder: in production, fetch diff from GitHub API
    // For hackathon demo, use PR description as the review input
    const reviewInput = `PR #${prNumber} in ${repoName}\nURL: ${prUrl}\nBranch: ${payload.pull_request?.head.ref}`
    const result = await reviewCode(reviewInput)

    const review = await createCodeReview({
      teamId: 'webhook',
      repoName,
      prNumber,
      prUrl,
      qualityScore: result.qualityScore,
      status: 'DONE',
      issues: result.issues,
      overallFeedback: result.overallFeedback,
      linkedTaskId: null,
    })

    return reply.status(201).send({ data: review })
  })

  // GET /reviews?teamId=
  app.get('/reviews', async (req, reply) => {
    const { teamId } = req.query as { teamId?: string }
    if (!teamId) return reply.status(400).send({ error: 'teamId is required' })
    const reviews = await listCodeReviews(teamId)
    return { data: reviews }
  })
}
