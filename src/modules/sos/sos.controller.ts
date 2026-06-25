import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as sosService from "./sos.service";
import type { SosAlertQuery } from "./sos.validation";

export const createSosAlert: RequestHandler = asyncHandler(async (req, res) => {
  const alert = await sosService.createSosAlert(req.user!.id, req.body);
  res.status(201).json({ success: true, data: alert });
});

export const listSosAlerts: RequestHandler = asyncHandler(async (req, res) => {
  const alerts = await sosService.listSosAlerts(req.user!, req.query as unknown as SosAlertQuery);
  res.json({ success: true, ...alerts });
});

export const getSosAlert: RequestHandler = asyncHandler(async (req, res) => {
  const alert = await sosService.getSosAlert(req.user!, req.params.id as string);
  res.json({ success: true, data: alert });
});

export const acknowledgeSosAlert: RequestHandler = asyncHandler(async (req, res) => {
  const alert = await sosService.acknowledgeSosAlert(req.user!, req.params.id as string);
  res.json({ success: true, data: alert });
});

export const resolveSosAlert: RequestHandler = asyncHandler(async (req, res) => {
  const alert = await sosService.resolveSosAlert(req.user!, req.params.id as string, req.body.resolutionNote);
  res.json({ success: true, data: alert });
});

export const cancelSosAlert: RequestHandler = asyncHandler(async (req, res) => {
  const alert = await sosService.cancelSosAlert(req.user!, req.params.id as string);
  res.json({ success: true, data: alert });
});
