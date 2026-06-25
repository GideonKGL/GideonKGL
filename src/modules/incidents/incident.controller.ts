import type { RequestHandler } from "express";
import { asyncHandler } from "../../utils/async-handler";
import * as incidentService from "./incident.service";
import type { IncidentQuery } from "./incident.validation";

export const createIncident: RequestHandler = asyncHandler(async (req, res) => {
  const incident = await incidentService.createIncident(req.user!.id, req.body);
  res.status(201).json({ success: true, data: incident });
});

export const listIncidents: RequestHandler = asyncHandler(async (req, res) => {
  const incidents = await incidentService.listIncidents(req.user!, req.query as unknown as IncidentQuery);
  res.json({ success: true, ...incidents });
});

export const getIncident: RequestHandler = asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncident(req.user!, req.params.id as string);
  res.json({ success: true, data: incident });
});

export const updateIncident: RequestHandler = asyncHandler(async (req, res) => {
  const incident = await incidentService.updateIncident(req.user!, req.params.id as string, req.body);
  res.json({ success: true, data: incident });
});

export const assignIncident: RequestHandler = asyncHandler(async (req, res) => {
  const incident = await incidentService.assignIncident(req.user!, req.params.id as string, req.body);
  res.json({ success: true, data: incident });
});

export const updateIncidentStatus: RequestHandler = asyncHandler(async (req, res) => {
  const incident = await incidentService.updateIncidentStatus(req.user!, req.params.id as string, req.body);
  res.json({ success: true, data: incident });
});
