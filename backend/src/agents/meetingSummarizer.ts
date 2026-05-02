import { callAgent } from '../services/gemini.js'
import { MEETING_SUMMARIZER_PROMPT } from './prompts.js'
import type { Schema } from '@google-cloud/vertexai'
import type { TaskPriority } from '../services/firestore.js'

export interface ActionItem {
  title: string
  ownerName: string | null
  dueDate: string | null
  priority: TaskPriority
}

export interface MeetingSummary {
  actionItems: ActionItem[]
  keyDecisions: string[]
  summary: string
}

const schema: Schema = {
  type: 'object',
  properties: {
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          ownerName: { type: 'string' },
          dueDate: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        },
        required: ['title', 'priority'],
      },
    },
    keyDecisions: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['actionItems', 'keyDecisions', 'summary'],
}

export async function parseMeetingNotes(rawText: string): Promise<MeetingSummary> {
  return callAgent<MeetingSummary>(MEETING_SUMMARIZER_PROMPT, rawText, schema)
}
