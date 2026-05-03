import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let _app: FirebaseApp | null = null
let _auth: Auth | null = null

// Lazy init so Next.js static prerender never touches Firebase at build time —
// only the client (after mount, inside AuthProvider's useEffect) ever calls this.
export function getFirebaseAuth(): Auth {
  if (_auth) return _auth
  if (!firebaseConfig.apiKey) {
    throw new Error(
      'NEXT_PUBLIC_FIREBASE_API_KEY is not set. ' +
      'Copy your Firebase web config into frontend/.env.local (local) ' +
      'or pass _FIREBASE_API_KEY/_FIREBASE_APP_ID as Cloud Build substitutions (deploy).'
    )
  }
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  _auth = getAuth(_app)
  return _auth
}

export const googleProvider = new GoogleAuthProvider()
