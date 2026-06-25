import { Role } from "@prisma/client";
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as userController from "./user.controller";
import { updateProfileSchema, updateUserAccessSchema, userParamsSchema, userQuerySchema } from "./user.validation";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get("/", validate({ query: userQuerySchema }), userController.listUsers);
userRoutes.patch("/me", validate({ body: updateProfileSchema }), userController.updateProfile);
userRoutes.get("/:id", validate({ params: userParamsSchema }), userController.getUser);
userRoutes.patch(
  "/:id/access",
  requireRoles(Role.ADMIN),
  validate({ params: userParamsSchema, body: updateUserAccessSchema }),
  userController.updateUserAccess
);
