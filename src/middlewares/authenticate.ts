import { Request, Response, NextFunction } from "express";
import config from "config";
import log from "../utils/logger";
import db from "../models/db";
import { User } from "../models/schemas/user";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import { AppResponse } from "../utils/helpers";

const expectedAppKey = config.get<string>("application.key");

const authSchema = z.object({
  userKey: z.string().min(1),
  appKey: z.string().min(1),
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const headers = {
      userKey: req.headers["x-user-key"],
      appKey: req.headers["x-app-key"],
    };
    const { userKey, appKey } = authSchema.parse(headers);

    log.debug({ headers }, "Received headers for authentication");

    if (appKey !== expectedAppKey) {
      log.warn(`Authentication failed: Invalid X-APP-KEY: ${appKey}`);
      AppResponse.error(res, "Forbidden: Invalid Application Key.");
      return;
    }

    try {
      const foundUser = await db.query.User.findFirst({
        where: eq(User.id, userKey),
      });

      if (!foundUser) {
        log.warn(`Authentication failed: User not found for key: ${userKey}`);
        AppResponse.error(res, "Forbidden: User not found.");
        return;
      }

      log.info(`Authentication successful for user ID: ${foundUser.id}`);
      req.user = foundUser;
      next();
      return;
    } catch (error) {
      log.error(error, "Error during database lookup for authentication:");
      AppResponse.error(res, "Internal Server Error during authentication.");
      return;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      log.warn(`Authentication failed: Invalid headers`, error);
      AppResponse.error(res, "Forbidden: Invalid request.", null, 403);
      return;
    }
    log.error("Error during authentication:", error);
    AppResponse.error(res, "Internal Server Error during authentication.");
    return;
  }
};
