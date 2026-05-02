import { callAgent } from '../services/gemini.js'
import { CODE_REVIEWER_PROMPT } from './prompts.js'
import type { Schema } from '@google-cloud/vertexai'

export interface CodeIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO'
  type: string
  file: string
  line: number | null
  message: string
  suggestion: string
}

export interface CodeReviewResult {
  qualityScore: number
  issues: CodeIssue[]
  overallFeedback: string
  securityFlags: string[]
}

const schema: Schema = {
  type: 'object',
  properties: {
    qualityScore: { type: 'number' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['ERROR', 'WARNING', 'INFO'] },
          type: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'number' },
          message: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['severity', 'type', 'file', 'message', 'suggestion'],
      },
    },
    overallFeedback: { type: 'string' },
    securityFlags: { type: 'array', items: { type: 'string' } },
  },
  required: ['qualityScore', 'issues', 'overallFeedback', 'securityFlags'],
}

export async function reviewCode(codeOrDiff: string): Promise<CodeReviewResult> {
  return callAgent<CodeReviewResult>(CODE_REVIEWER_PROMPT, codeOrDiff, schema)
}
