import * as admin from "firebase-admin";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: admin.app.App | null = null;

function initFirebase(): admin.app.App {
  if (admin.apps.length > 0) {
    app = admin.apps[0] as admin.app.App;
    return app;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const credential = JSON.parse(json) as admin.ServiceAccount;
    app = admin.initializeApp({ credential: admin.credential.cert(credential) });
  } else {
    app = admin.initializeApp(); // uses GOOGLE_APPLICATION_CREDENTIALS
  }
  return app;
}

export function getDb(): Firestore {
  if (!app) initFirebase();
  return getFirestore();
}
