import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { authController } from "./auth.controller.js";
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  pinLoginSchema,
  refreshSchema,
  registerSchema,
  setPinSchema
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(authController.register));
authRouter.post("/login", validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/pin-login", validate(pinLoginSchema), asyncHandler(authController.pinLogin));
authRouter.post("/refresh", validate(refreshSchema), asyncHandler(authController.refresh));
authRouter.post("/password-reset/request", validate(passwordResetRequestSchema), asyncHandler(authController.requestPasswordReset));
authRouter.post("/password-reset/confirm", validate(passwordResetConfirmSchema), asyncHandler(authController.confirmPasswordReset));
authRouter.post("/pin", authenticate, validate(setPinSchema), asyncHandler(authController.setPin));
