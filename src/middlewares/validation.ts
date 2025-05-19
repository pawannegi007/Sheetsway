import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppResponse } from "../utils/helpers";
import log from "../utils/logger";

interface ErrorMessage {
  path: string;
  message: string;
  code: string;
}

export function validateRequestSchema(
  schema: ZodSchema,
  type: "body" | "params" | "query" = "body",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[type];
    const validation = schema.safeParse(data);

    if (!validation.success) {
      const errorMessages: ErrorMessage[] = validation.error.errors.map(
        (error) => ({
          path: error.path.join(".") || "non_field_error",
          message: error.message,
          code: error.code,
        }),
      );
      log.error(`Request ${type} validation failed`, { errors: errorMessages });
      AppResponse.error(res, "Validation Error", errorMessages);
      return;
    }
    next();
  };
}
