import { GoogleGenAI, Type } from '@google/genai'
import { config } from '../config.js'

export { Type }
export type { Schema } from '@google/genai'

const ai = new GoogleGenAI({
  vertexai: true,
  project: config.gcpProjectId,
  location: config.vertexAiLocation,
})

export async function callAgent<T>(
  systemPrompt: string,
  userInput: string,
  responseSchema: object
): Promise<T> {
  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: [{ role: 'user', parts: [{ text: userInput }] }],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema,
    },
  })

  const text = response.text
  if (!text) throw new Error('Empty response from Gemini')
  return JSON.parse(text) as T
}
