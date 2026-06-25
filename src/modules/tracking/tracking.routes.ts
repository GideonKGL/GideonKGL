import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as trackingController from "./tracking.controller";
import {
  createLocationSchema,
  locationHistoryQuerySchema,
  trackingUserParamsSchema
} from "./tracking.validation";

export const trackingRoutes = Router();

trackingRoutes.use(authenticate);
trackingRoutes.post("/locations", validate({ body: createLocationSchema }), trackingController.createLocation);
trackingRoutes.get("/locations/me/latest", trackingController.getMyLatestLocation);
trackingRoutes.get(
  "/locations/me",
  validate({ query: locationHistoryQuerySchema }),
  trackingController.getMyLocationHistory
);
trackingRoutes.get(
  "/users/:userId/latest",
  requireRoles(Role.ADMIN, Role.DISPATCHER, Role.RESPONDER),
  validate({ params: trackingUserParamsSchema }),
  trackingController.getUserLatestLocation
);
trackingRoutes.get(
  "/users/:userId/locations",
  requireRoles(Role.ADMIN, Role.DISPATCHER, Role.RESPONDER),
  validate({ params: trackingUserParamsSchema, query: locationHistoryQuerySchema }),
  trackingController.getUserLocationHistory
);
