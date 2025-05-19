import { Request, Response, NextFunction } from "express";
import { AppResponse } from "../utils/helpers";
import log from "../utils/logger";

interface HTTPError extends Error {
  statusCode?: number;
  errors?: Array<object>;
}

export function exceptionHandler(
  err: HTTPError,
  _: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(err);
  }
  log.error(err.stack);
  const statusCode = err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";
  const errors = err.errors || [];
  AppResponse.error(res, message, errors, statusCode);
  return;
}

export function notfoundHandler(req: Request, res: Response, _: NextFunction) {
  const message = `Cannot ${req.method} ${req.url}`;
  AppResponse.error(res, message, null, 404);
  return;
}
