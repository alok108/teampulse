import { callAgent, Type } from '../services/gemini.js'
import { CODE_REVIEWER_PROMPT } from './prompts.js'

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

const schema = {
  type: Type.OBJECT,
  properties: {
    qualityScore: { type: Type.NUMBER },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ['ERROR', 'WARNING', 'INFO'] },
          type: { type: Type.STRING },
          file: { type: Type.STRING },
          line: { type: Type.NUMBER },
          message: { type: Type.STRING },
          suggestion: { type: Type.STRING },
        },
        required: ['severity', 'type', 'file', 'message', 'suggestion'],
      },
    },
    overallFeedback: { type: Type.STRING },
    securityFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['qualityScore', 'issues', 'overallFeedback', 'securityFlags'],
}

export async function reviewCode(codeOrDiff: string): Promise<CodeReviewResult> {
  return callAgent<CodeReviewResult>(CODE_REVIEWER_PROMPT, codeOrDiff, schema)
}
