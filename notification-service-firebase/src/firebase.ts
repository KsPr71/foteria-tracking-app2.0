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
  if (!json || json.trim().length === 0) {
    console.error("[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Firestore no funcionará.");
    app = initializeApp();
    return app;
  }
  try {
    const credential = JSON.parse(json) as ServiceAccount;
    const projectId = credential.project_id ?? "(desconocido)";
    if (!credential.project_id || !credential.private_key || !credential.client_email) {
      console.error("[Firebase] Credenciales incompletas. Verifica project_id, private_key y client_email.");
    } else {
      console.log("[Firebase] Inicializado proyecto:", projectId);
    }
    app = initializeApp({ credential: cert(credential) });
  } catch (e) {
    console.error("[Firebase] Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON:", e instanceof Error ? e.message : String(e));
    throw e;
  }
  return app;
}

export function getDb(): Firestore {
  if (!app) initFirebase();
  return getFirestore();
}
