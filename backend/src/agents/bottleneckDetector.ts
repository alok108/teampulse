import { callAgent } from '../services/gemini.js'
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
  type: 'object',
  properties: {
    blockedTasks: { type: 'array', items: { type: 'string' } },
    overloadedMembers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          taskCount: { type: 'number' },
        },
        required: ['name', 'taskCount'],
      },
    },
    atRiskDeadlines: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
    healthScore: { type: 'number' },
    summary: { type: 'string' },
  },
  required: ['blockedTasks', 'overloadedMembers', 'atRiskDeadlines', 'recommendations', 'healthScore', 'summary'],
}

export async function detectBottlenecks(boardSnapshot: string): Promise<BottleneckReport> {
  return callAgent<BottleneckReport>(BOTTLENECK_DETECTOR_PROMPT, boardSnapshot, schema)
}
