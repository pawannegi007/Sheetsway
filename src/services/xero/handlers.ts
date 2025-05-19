import { RequestHandler } from "express";
import { XeroClient } from "xero-node";
import config from "config";
import { AppResponse, Encryption } from "../../utils/helpers";
import { Softwares, User } from "../../models/schemas";
import db from "../../models/db";
import { eq } from "drizzle-orm";
import logger from "../../utils/logger";
import {
  journatDateFilterSchema,
  xeroCallbackSchema,
} from "../../schemas/xero";
import { z } from "zod";
import { getBankTransactions, getJournals } from "./reports";
import { dateFilterSchema } from "../../schemas";

const XERO_CLIENT_ID = config.get<string>("modules.xero.clientId");
const XERO_CLIENT_SECRET = config.get<string>("modules.xero.clientSecret");
const XERO_REDIRECT_URI = config.get<string>("modules.xero.redirectUri");
const XERO_SCOPES = config.get<string[]>("modules.xero.scopes");

const connectHandler: RequestHandler = async (req, res) => {
  const user = req.user;
  const state = Encryption.encrypt(user!.id);
  const xero = new XeroClient({
    clientId: XERO_CLIENT_ID,
    clientSecret: XERO_CLIENT_SECRET,
    redirectUris: [XERO_REDIRECT_URI],
    scopes: XERO_SCOPES,
    state: state,
  });

  const authUrl = await xero.buildConsentUrl();
  AppResponse.success(res, "Redirect user to Xero authorization URL", {
    authUrl: authUrl,
  });
};

const callbackHandler: RequestHandler = async (req, res, next) => {
  try {
    const { state } = req.query as unknown as z.infer<
      typeof xeroCallbackSchema
    >;
    const xero = new XeroClient({
      clientId: XERO_CLIENT_ID,
      clientSecret: XERO_CLIENT_SECRET,
      redirectUris: [XERO_REDIRECT_URI],
      scopes: XERO_SCOPES,
      state,
    });

    const user_id = Encryption.decrypt(state as string);
    const tokenSet = await xero.apiCallback(req.url);
    console.log("Token Set", tokenSet);
    const userExists = await db.query.User.findFirst({
      where: eq(User.id, user_id),
    });

    if (!userExists) {
      logger.error("User not found");
      AppResponse.error(res, "User not found");
      return;
    }
    const encryptedPayload = Encryption.encrypt(JSON.stringify(tokenSet));
    await db
      .insert(Softwares)
      .values([
        {
          user_id,
          software_type: "Xero",
          connection_data: encryptedPayload,
        },
      ])
      .onConflictDoUpdate({
        target: [Softwares.user_id, Softwares.software_type],
        set: {
          connection_data: encryptedPayload,
        },
      });

    AppResponse.success(res, "Xero connection successful.");
    return;
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error processing Xero callback:", error);
      AppResponse.error(
        res,
        `Internal server error during callback processing: ${error.message}`
      );
      return;
    }
    next(error);
    return;
  }
};

const journalHandler: RequestHandler = async (req, res, next) => {
  try {
    const { startDate } = req.body as unknown as z.infer<
      typeof journatDateFilterSchema
    >;
    const user = req.user;
    const journals = await getJournals(user!.id, startDate);
    AppResponse.success(res, "Journals fetched successfully", journals);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error, "Error fetching journals");
      AppResponse.error(
        res,
        `Internal server error during callback processing: ${error.message}`
      );
      return;
    }
    logger.error(error, "Error fetching journals");
    next(error);
    return;
  }
};

const bankTransactionsHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { startDate, endDate } = req.body as unknown as z.infer<
      typeof dateFilterSchema
    >;
    const report = await getBankTransactions(user!.id, startDate, endDate);
    AppResponse.success(res, "Bank transactions fetched successfully", report);
    return;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error, "Error fetching bank transactions");
      AppResponse.error(
        res,
        `Internal server error during callback processing: ${error.message}`
      );
      return;
    }
    logger.error(error, "Error fetching bank transactions");
    next(error);
    return;
  }
};

export {
  connectHandler,
  callbackHandler,
  journalHandler,
  bankTransactionsHandler,
};
