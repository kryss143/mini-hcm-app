import "dotenv/config";
import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
function init() {
  if (admin.apps.length) return admin;
  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson);
    admin.initializeApp({ credential: admin.credential.cert(parsed) });
    return admin;
  }
  if (serviceAccountPath) {
    const parsed = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(parsed) });
    return admin;
  }
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  return admin;
}

export const firebaseAdmin = init();
export const db = firebaseAdmin.firestore();
export const auth = firebaseAdmin.auth();
