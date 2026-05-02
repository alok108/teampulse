import { callAgent } from '../services/gemini.js'
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
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    estimatedHours: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
    subtasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          done: { type: 'boolean' },
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
