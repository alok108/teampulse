import { callAgent, SchemaType } from '../services/gemini.js'
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
  type: SchemaType.OBJECT,
  properties: {
    actionItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          ownerName: { type: SchemaType.STRING },
          dueDate: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        },
        required: ['title', 'priority'],
      },
    },
    keyDecisions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    summary: { type: SchemaType.STRING },
  },
  required: ['actionItems', 'keyDecisions', 'summary'],
}

export async function parseMeetingNotes(rawText: string): Promise<MeetingSummary> {
  return callAgent<MeetingSummary>(MEETING_SUMMARIZER_PROMPT, rawText, schema)
}
