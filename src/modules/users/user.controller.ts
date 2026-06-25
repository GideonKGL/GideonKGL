import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as userService from "./user.service";
import type { UserQuery } from "./user.validation";

export const listUsers: RequestHandler = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.user!, req.query as unknown as UserQuery);
  res.json({ success: true, ...users });
});

export const getUser: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.user!, req.params.id as string);
  res.json({ success: true, data: user });
});

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, data: user });
});

export const updateUserAccess: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.updateUserAccess(req.user!, req.params.id as string, req.body);
  res.json({ success: true, data: user });
});
