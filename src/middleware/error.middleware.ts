import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../utils/app-error";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`, "ROUTE_NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      statusCode = 409;
      code = "UNIQUE_CONSTRAINT_VIOLATION";
      message = "A record with the provided unique value already exists";
      details = error.meta;
    } else if (error.code === "P2025") {
      statusCode = 404;
      code = "NOT_FOUND";
      message = "Requested record not found";
      details = error.meta;
    }
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    code = error.code;
    message = error.message;
  }

  if (statusCode >= 500) {
    logger.error({ error, requestId: req.id }, "Unhandled request error");
  } else {
    logger.warn({ error, requestId: req.id }, "Request failed");
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: env.NODE_ENV === "production" && statusCode >= 500 ? undefined : details
    }
  });
};
