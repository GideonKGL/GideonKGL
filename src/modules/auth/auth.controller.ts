import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as authService from "./auth.service";

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
});

export const loginWithPin: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.loginWithPin(req.body);
  res.json({ success: true, data: result });
});

export const setupPin: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.setupPin(req.user!.id, req.body);
  res.json({ success: true, data: result });
});

export const loginWithFirebase: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.loginWithFirebase(req.body);
  res.json({ success: true, data: result });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ success: true, data: user });
});
