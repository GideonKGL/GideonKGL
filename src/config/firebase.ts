import { applicationDefault, cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env";
import { logger } from "./logger";

const loadServiceAccount = (): ServiceAccount | undefined => {
  const rawJson =
    env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    (env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
      : undefined);

  if (!rawJson) {
    return undefined;
  }

  return JSON.parse(rawJson) as ServiceAccount;
};

export const initializeFirebase = (): App | undefined => {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = loadServiceAccount();

  if (serviceAccount) {
    logger.info("Initializing Firebase Admin with service account credentials");
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID || serviceAccount.projectId
    });
  }

  if (env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    logger.info("Initializing Firebase Admin with application default credentials");
    return initializeApp({
      credential: applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID
    });
  }

  logger.warn("Firebase Admin credentials not configured; Firebase auth route will reject requests");
  return undefined;
};

export const firebaseApp = initializeFirebase();
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : undefined;
