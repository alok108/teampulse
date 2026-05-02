import { callAgent, Type } from '../services/gemini.js'
import { BOTTLENECK_DETECTOR_PROMPT } from './prompts.js'

export interface BottleneckReport {
  blockedTasks: string[]
  overloadedMembers: { name: string; taskCount: number }[]
  atRiskDeadlines: string[]
  recommendations: string[]
  healthScore: number
  summary: string
}

const schema = {
  type: Type.OBJECT,
  properties: {
    blockedTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
    overloadedMembers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          taskCount: { type: Type.NUMBER },
        },
        required: ['name', 'taskCount'],
      },
    },
    atRiskDeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    healthScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
  },
  required: ['blockedTasks', 'overloadedMembers', 'atRiskDeadlines', 'recommendations', 'healthScore', 'summary'],
}

export async function detectBottlenecks(boardSnapshot: string): Promise<BottleneckReport> {
  return callAgent<BottleneckReport>(BOTTLENECK_DETECTOR_PROMPT, boardSnapshot, schema)
}
