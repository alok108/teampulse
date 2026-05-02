export const config = {
  port: Number(process.env.PORT) || 8080,
  gcpProjectId: process.env.GCP_PROJECT_ID || 'promptwars-chennai-495105',
  gcpRegion: process.env.GCP_REGION || 'us-central1',
  vertexAiLocation: process.env.VERTEX_AI_LOCATION || 'us-central1',
  firestoreDatabase: process.env.FIRESTORE_DATABASE || 'teampulse',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  geminiModel: 'gemini-2.5-flash',
}
