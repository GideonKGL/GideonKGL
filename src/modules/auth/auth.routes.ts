import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as authController from "./auth.controller";
import {
  firebaseLoginSchema,
  loginSchema,
  pinLoginSchema,
  registerSchema,
  setupPinSchema
} from "./auth.validation";

export const authRoutes = Router();

authRoutes.post("/register", validate({ body: registerSchema }), authController.register);
authRoutes.post("/login", validate({ body: loginSchema }), authController.login);
authRoutes.post("/firebase", validate({ body: firebaseLoginSchema }), authController.loginWithFirebase);
authRoutes.post("/pin/login", validate({ body: pinLoginSchema }), authController.loginWithPin);
authRoutes.post("/pin/setup", authenticate, validate({ body: setupPinSchema }), authController.setupPin);
authRoutes.get("/me", authenticate, authController.me);
