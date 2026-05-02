import { callAgent, SchemaType } from '../services/gemini.js'
import { BOTTLENECK_DETECTOR_PROMPT } from './prompts.js'
import type { Schema } from '@google-cloud/vertexai'

export interface BottleneckReport {
  blockedTasks: string[]
  overloadedMembers: { name: string; taskCount: number }[]
  atRiskDeadlines: string[]
  recommendations: string[]
  healthScore: number
  summary: string
}

const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    blockedTasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    overloadedMembers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          taskCount: { type: SchemaType.NUMBER },
        },
        required: ['name', 'taskCount'],
      },
    },
    atRiskDeadlines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    healthScore: { type: SchemaType.NUMBER },
    summary: { type: SchemaType.STRING },
  },
  required: ['blockedTasks', 'overloadedMembers', 'atRiskDeadlines', 'recommendations', 'healthScore', 'summary'],
}

export async function detectBottlenecks(boardSnapshot: string): Promise<BottleneckReport> {
  return callAgent<BottleneckReport>(BOTTLENECK_DETECTOR_PROMPT, boardSnapshot, schema)
}
