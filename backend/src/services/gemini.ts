import { VertexAI } from '@google-cloud/vertexai'
import { config } from '../config.js'
import type { Schema } from '@google-cloud/vertexai'

const vertexAI = new VertexAI({
  project: config.gcpProjectId,
  location: config.vertexAiLocation,
})

const model = vertexAI.getGenerativeModel({
  model: config.geminiModel,
})

export async function callAgent<T>(
  systemPrompt: string,
  userInput: string,
  responseSchema: Schema
): Promise<T> {
  const req = {
    contents: [{ role: 'user' as const, parts: [{ text: userInput }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  }

  const result = await model.generateContent(req)
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return JSON.parse(text) as T
}
