import { callAgent, SchemaType } from '../services/gemini.js'
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
  type: SchemaType.OBJECT,
  properties: {
    qualityScore: { type: SchemaType.NUMBER },
    issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          severity: { type: SchemaType.STRING, enum: ['ERROR', 'WARNING', 'INFO'] },
          type: { type: SchemaType.STRING },
          file: { type: SchemaType.STRING },
          line: { type: SchemaType.NUMBER },
          message: { type: SchemaType.STRING },
          suggestion: { type: SchemaType.STRING },
        },
        required: ['severity', 'type', 'file', 'message', 'suggestion'],
      },
    },
    overallFeedback: { type: SchemaType.STRING },
    securityFlags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['qualityScore', 'issues', 'overallFeedback', 'securityFlags'],
}

export async function reviewCode(codeOrDiff: string): Promise<CodeReviewResult> {
  return callAgent<CodeReviewResult>(CODE_REVIEWER_PROMPT, codeOrDiff, schema)
}
