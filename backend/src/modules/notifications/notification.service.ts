import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { emitUser } from "../../realtime/events.js";

const hasFirebaseConfig = env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY;
let cachedAccessToken: { token: string; expiresAt: number } | undefined;

const base64Url = (value: Buffer | string) =>
  Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const firebaseAccessToken = async () => {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: env.FIREBASE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"));

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${base64Url(signature)}`
    })
  });

  if (!response.ok) {
    throw new Error(`Firebase token request failed: ${await response.text()}`);
  }

  const token = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000
  };
  return cachedAccessToken.token;
};

const sendFirebaseMessage = async (deviceToken: string, notification: { title: string; body: string; data?: Record<string, string> }) => {
  const accessToken = await firebaseAccessToken();
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Firebase message request failed: ${await response.text()}`);
  }
};

export const notificationService = {
  create: async (input: {
    userId: string;
    type: "SOS" | "LOCATION" | "SYSTEM" | "SECURITY";
    title: string;
    body: string;
    data?: Record<string, string>;
  }) => {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data
      }
    });

    emitUser(input.userId, "notification.created", notification);

    const devices = await prisma.device.findMany({
      where: { userId: input.userId, fcmToken: { not: null }, isActive: true }
    });

    if (hasFirebaseConfig && devices.length > 0) {
      await Promise.allSettled(
        devices.map((device) =>
          sendFirebaseMessage(device.fcmToken!, {
            title: input.title,
            body: input.body,
            data: input.data
          })
        )
      );
    } else if (!hasFirebaseConfig) {
      logger.warn("Firebase is not configured; notification stored without push delivery");
    }

    return notification;
  }
};
