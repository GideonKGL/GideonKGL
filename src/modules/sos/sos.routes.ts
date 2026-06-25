import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as sosController from "./sos.controller";
import {
  createSosAlertSchema,
  resolveSosAlertSchema,
  sosAlertParamsSchema,
  sosAlertQuerySchema
} from "./sos.validation";

export const sosRoutes = Router();

sosRoutes.use(authenticate);
sosRoutes.post("/", validate({ body: createSosAlertSchema }), sosController.createSosAlert);
sosRoutes.get("/", validate({ query: sosAlertQuerySchema }), sosController.listSosAlerts);
sosRoutes.get("/:id", validate({ params: sosAlertParamsSchema }), sosController.getSosAlert);
sosRoutes.post(
  "/:id/acknowledge",
  requireRoles(Role.ADMIN, Role.DISPATCHER, Role.RESPONDER),
  validate({ params: sosAlertParamsSchema }),
  sosController.acknowledgeSosAlert
);
sosRoutes.post(
  "/:id/resolve",
  requireRoles(Role.ADMIN, Role.DISPATCHER, Role.RESPONDER),
  validate({ params: sosAlertParamsSchema, body: resolveSosAlertSchema }),
  sosController.resolveSosAlert
);
sosRoutes.post("/:id/cancel", validate({ params: sosAlertParamsSchema }), sosController.cancelSosAlert);
