export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, message, "BAD_REQUEST", details);

export const unauthorized = (message = "Authentication required"): AppError =>
  new AppError(401, message, "UNAUTHORIZED");

export const forbidden = (message = "Insufficient permissions"): AppError =>
  new AppError(403, message, "FORBIDDEN");

export const notFound = (resource = "Resource"): AppError =>
  new AppError(404, `${resource} not found`, "NOT_FOUND");

export const conflict = (message: string, details?: unknown): AppError =>
  new AppError(409, message, "CONFLICT", details);
