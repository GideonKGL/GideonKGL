import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = "HTTP_ERROR"
  ) {
    super(message);
  }
}

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`, "NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.code, message: error.message });
    return;
  }

  logger.error("Unhandled API error", { message: error?.message, stack: error?.stack });
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Unexpected server error" });
};
