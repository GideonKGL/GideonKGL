import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types.js";
import { authService } from "./auth.service.js";

const metadata = (req: AuthenticatedRequest) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent")
});

export const authController = {
  register: async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.register({ ...req.body, ...metadata(req) });
    res.status(201).json(result);
  },

  login: async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password, metadata(req));
    res.json(result);
  },

  pinLogin: async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.pinLogin(req.body.email, req.body.pin, metadata(req));
    res.json(result);
  },

  setPin: async (req: AuthenticatedRequest, res: Response) => {
    await authService.setPin(req.user!.id, req.body.pin);
    res.status(204).send();
  },

  refresh: async (req: AuthenticatedRequest, res: Response) => {
    res.json(await authService.refresh(req.body.refreshToken));
  },

  requestPasswordReset: async (req: AuthenticatedRequest, res: Response) => {
    const resetToken = await authService.requestPasswordReset(req.body.email);
    res.json({
      message: "If the account exists, a password reset will be issued.",
      resetToken: process.env.NODE_ENV === "production" ? undefined : resetToken
    });
  },

  confirmPasswordReset: async (req: AuthenticatedRequest, res: Response) => {
    await authService.confirmPasswordReset(req.body.token, req.body.password);
    res.status(204).send();
  }
};
