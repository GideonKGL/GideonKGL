import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    }) as { body?: unknown; params?: Request["params"]; query?: Request["query"] };

    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    // Express 5 exposes `req.query` as a getter-only property, so it cannot be
    // reassigned. Redefine it as an own property when the schema produced a
    // (possibly transformed) query object.
    if (parsed.query !== undefined) {
      Object.defineProperty(req, "query", {
        value: parsed.query,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    next();
  };
