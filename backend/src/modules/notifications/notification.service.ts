import admin from "firebase-admin";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { emitUser } from "../../realtime/events.js";

const hasFirebaseConfig = env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseConfig && admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });
}

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
          admin.messaging().send({
            token: device.fcmToken!,
            notification: { title: input.title, body: input.body },
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
