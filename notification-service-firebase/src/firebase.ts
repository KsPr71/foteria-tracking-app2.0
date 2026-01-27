import { initializeApp, getApps, cert, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

function initFirebase(): App {
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0] as App;
    return app;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const credential = JSON.parse(json) as ServiceAccount;
    app = initializeApp({ credential: cert(credential) });
  } else {
    app = initializeApp();
  }
  return app;
}

export function getDb(): Firestore {
  if (!app) initFirebase();
  return getFirestore();
}
