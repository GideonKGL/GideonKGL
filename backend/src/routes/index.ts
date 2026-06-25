import { Router } from "express";
import { alertsRouter } from "../modules/alerts/alerts.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { devicesRouter } from "../modules/devices/devices.routes.js";
import { locationsRouter } from "../modules/locations/locations.routes.js";
import { notificationsRouter } from "../modules/notifications/notifications.routes.js";
import { reportsRouter } from "../modules/reports/reports.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "guardian-tracker-api", timestamp: new Date().toISOString() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/devices", devicesRouter);
apiRouter.use("/locations", locationsRouter);
apiRouter.use("/alerts", alertsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/reports", reportsRouter);
