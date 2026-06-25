import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as deviceService from "./device.service";

export const registerDevice: RequestHandler = asyncHandler(async (req, res) => {
  const device = await deviceService.registerDevice(req.user!.id, req.body);
  res.status(201).json({ success: true, data: device });
});

export const listDevices: RequestHandler = asyncHandler(async (req, res) => {
  const devices = await deviceService.listDevices(req.user!.id);
  res.json({ success: true, data: devices });
});

export const updateDevice: RequestHandler = asyncHandler(async (req, res) => {
  const device = await deviceService.updateDevice(req.user!, req.params.id as string, req.body);
  res.json({ success: true, data: device });
});

export const revokeDevice: RequestHandler = asyncHandler(async (req, res) => {
  const device = await deviceService.revokeDevice(req.user!, req.params.id as string);
  res.json({ success: true, data: device });
});
