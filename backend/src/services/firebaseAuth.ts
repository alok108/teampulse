import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { config } from '../config.js'

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: config.gcpProjectId,
  })
}

export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  return getAuth().verifyIdToken(token)
}
