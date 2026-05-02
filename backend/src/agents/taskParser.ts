import { callAgent, Type } from '../services/gemini.js'
import { TASK_PARSER_PROMPT } from './prompts.js'
import type { TaskPriority } from '../services/firestore.js'

export interface ParsedTask {
  title: string
  description: string
  priority: TaskPriority
  estimatedHours: number
  tags: string[]
  subtasks: { title: string; done: boolean }[]
}

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    estimatedHours: { type: Type.NUMBER },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    subtasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          done: { type: Type.BOOLEAN },
        },
        required: ['title', 'done'],
      },
    },
  },
  required: ['title', 'description', 'priority', 'estimatedHours', 'tags', 'subtasks'],
}

export async function parseTask(rawDescription: string): Promise<ParsedTask> {
  return callAgent<ParsedTask>(TASK_PARSER_PROMPT, rawDescription, schema)
}
