import { callAgent, Type } from '../services/gemini.js'
import { MEETING_SUMMARIZER_PROMPT } from './prompts.js'
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

const schema = {
  type: Type.OBJECT,
  properties: {
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          ownerName: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        },
        required: ['title', 'priority'],
      },
    },
    keyDecisions: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
  },
  required: ['actionItems', 'keyDecisions', 'summary'],
}

export async function parseMeetingNotes(rawText: string): Promise<MeetingSummary> {
  return callAgent<MeetingSummary>(MEETING_SUMMARIZER_PROMPT, rawText, schema)
}
