import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as incidentController from "./incident.controller";
import {
  assignIncidentSchema,
  createIncidentSchema,
  incidentParamsSchema,
  incidentQuerySchema,
  updateIncidentSchema,
  updateIncidentStatusSchema
} from "./incident.validation";

export const incidentRoutes = Router();

incidentRoutes.use(authenticate);
incidentRoutes.post("/", validate({ body: createIncidentSchema }), incidentController.createIncident);
incidentRoutes.get("/", validate({ query: incidentQuerySchema }), incidentController.listIncidents);
incidentRoutes.get("/:id", validate({ params: incidentParamsSchema }), incidentController.getIncident);
incidentRoutes.patch(
  "/:id",
  validate({ params: incidentParamsSchema, body: updateIncidentSchema }),
  incidentController.updateIncident
);
incidentRoutes.post(
  "/:id/assign",
  requireRoles(Role.ADMIN, Role.DISPATCHER),
  validate({ params: incidentParamsSchema, body: assignIncidentSchema }),
  incidentController.assignIncident
);
incidentRoutes.patch(
  "/:id/status",
  requireRoles(Role.ADMIN, Role.DISPATCHER, Role.RESPONDER),
  validate({ params: incidentParamsSchema, body: updateIncidentStatusSchema }),
  incidentController.updateIncidentStatus
);
