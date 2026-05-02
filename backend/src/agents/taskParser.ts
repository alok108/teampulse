import { callAgent, SchemaType } from '../services/gemini.js'
import { TASK_PARSER_PROMPT } from './prompts.js'
import type { Schema } from '@google-cloud/vertexai'
import type { TaskPriority } from '../services/firestore.js'

export interface ParsedTask {
  title: string
  description: string
  priority: TaskPriority
  estimatedHours: number
  tags: string[]
  subtasks: { title: string; done: boolean }[]
}

const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    priority: { type: SchemaType.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    estimatedHours: { type: SchemaType.NUMBER },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    subtasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          done: { type: SchemaType.BOOLEAN },
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
