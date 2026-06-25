import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as trackingService from "./tracking.service";
import type { LocationHistoryQuery } from "./tracking.validation";

export const createLocation: RequestHandler = asyncHandler(async (req, res) => {
  const location = await trackingService.createLocation(req.user!.id, req.body);
  res.status(201).json({ success: true, data: location });
});

export const getMyLatestLocation: RequestHandler = asyncHandler(async (req, res) => {
  const location = await trackingService.getLatestLocation(req.user!, req.user!.id);
  res.json({ success: true, data: location });
});

export const getMyLocationHistory: RequestHandler = asyncHandler(async (req, res) => {
  const locations = await trackingService.getLocationHistory(
    req.user!,
    req.user!.id,
    req.query as unknown as LocationHistoryQuery
  );
  res.json({ success: true, ...locations });
});

export const getUserLatestLocation: RequestHandler = asyncHandler(async (req, res) => {
  const location = await trackingService.getLatestLocation(req.user!, req.params.userId as string);
  res.json({ success: true, data: location });
});

export const getUserLocationHistory: RequestHandler = asyncHandler(async (req, res) => {
  const locations = await trackingService.getLocationHistory(
    req.user!,
    req.params.userId as string,
    req.query as unknown as LocationHistoryQuery
  );
  res.json({ success: true, ...locations });
});
