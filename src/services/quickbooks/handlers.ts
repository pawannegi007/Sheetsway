import config from "config";
import log from "../../utils/logger";
import { Buffer } from "buffer";
import { AppResponse, Encryption } from "../../utils/helpers";
import { RequestHandler } from "express";
import { z } from "zod";
import db from "../../models/db";
import { eq, and } from "drizzle-orm";
import { Softwares, User } from "../../models/schemas";
import { getCreditorsList, getDebtorsList, getGeneralLedger } from "./reports";
import { qboCallbackSchema } from "../../schemas/qbo";
import { dateFilterSchema } from "../../schemas";

const OAUTH_SCOPES = [
  "com.intuit.quickbooks.accounting",
  "openid",
  "profile",
  "email",
  "phone",
  "address",
].join(" ");

const callbackHandler: RequestHandler = async (req, res, next) => {
  log.debug("Received callback from QuickBooks", { query: req.query });
  const { code, state, realmId } = req.query as z.infer<
    typeof qboCallbackSchema
  >;
  const user_id = Encryption.decrypt(state);

  log.debug("Received callback from QuickBooks", { user_id, code });

  try {
    const qbConfig = config.get<QuickbookConfig>("modules.quickbook");
    const tokenUrl = qbConfig.tokenEndpoint;
    const credentials = Buffer.from(
      `${qbConfig.clientId}:${qbConfig.clientSecret}`,
    ).toString("base64");

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code as string);
    params.append("redirect_uri", qbConfig.redirectUri);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params,
    });

    const tokenData = await response.json();

    if (!response.ok) {
      log.error("Failed to exchange code for token", {
        status: response.status,
        data: tokenData,
      });
      AppResponse.error(
        res,
        `Failed to get token: ${tokenData.error_description || tokenData.error || "Unknown error"}`,
      );
      return;
    }

    const {
      access_token,
      refresh_token,
      expires_in,
      x_refresh_token_expires_in,
    } = tokenData;
    const payload = {
      access_token,
      refresh_token,
      expires_in,
      x_refresh_token_expires_in,
      realmId,
    };
    const encryptedPayload = Encryption.encryptObject(payload);
    log.debug("Encrypted payload:", encryptedPayload);

    // save the payload
    const userExists = db.query.User.findFirst({
      where: eq(User.id, user_id),
    });

    if (!userExists) {
      log.error("User not found");
      AppResponse.error(res, "User not found");
      return;
    }

    await db
      .insert(Softwares)
      .values([
        {
          user_id,
          software_type: "QuickBooks",
          connection_data: encryptedPayload,
        },
      ])
      .onConflictDoUpdate({
        target: [Softwares.user_id, Softwares.software_type],
        set: {
          connection_data: encryptedPayload,
        },
      });

    AppResponse.success(res, "QuickBooks connection successful.");
    return;
  } catch (error) {
    if (error instanceof Error) {
      log.error("Error processing QuickBooks callback:", error);
      AppResponse.error(
        res,
        `Internal server error during callback processing: ${error.message}`,
      );
      return;
    }
    next(error);
    return;
  }
};

const connectHandler: RequestHandler = (req, res) => {
  try {
    const qbConfig = config.get<QuickbookConfig>("modules.quickbook");
    const user = req.user;
    if (!user) {
      log.error("User not found");
      AppResponse.error(res, "Please login first");
      return;
    }

    const state = Encryption.encrypt(user.id);
    const authUrl = new URL("https://appcenter.intuit.com/connect/oauth2");
    authUrl.searchParams.append("client_id", qbConfig.clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", OAUTH_SCOPES);
    authUrl.searchParams.append("redirect_uri", qbConfig.redirectUri);
    authUrl.searchParams.append("state", state);

    AppResponse.success(res, "Redirect user to QuickBooks authorization URL", {
      authUrl: authUrl.toString(),
    });
    return;
  } catch (error) {
    log.error("Error initiating QuickBooks OAuth connection:", error);
    AppResponse.error(res, "Failed to initiate QuickBooks connection.");
    return;
  }
};

const disconnectHandler: RequestHandler = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      AppResponse.error(res, "Please login first");
      return;
    }

    // Delete the QuickBooks connection
    await db
      .delete(Softwares)
      .where(
        and(
          eq(Softwares.user_id, user.id),
          eq(Softwares.software_type, "QuickBooks"),
        ),
      );
    AppResponse.success(res, "QuickBooks connection deleted successfully.");
    return;
  } catch (error) {
    log.error(error, "Error disconnecting from QuickBooks:");
    AppResponse.error(res, "Failed to disconnect from QuickBooks.");
    return;
  }
};

const requestGeneralLedgerHandler: RequestHandler = async (req, res, next) => {
  const user = req.user;
  const { startDate, endDate } = req.body as z.infer<typeof dateFilterSchema>;

  try {
    const payload = {
      userId: user!.id, // authenticated middleware ensures user exists
      startDate,
      endDate,
    };
    const data = await getGeneralLedger(payload);
    // AppResponse.success(res, "General ledger report generated.", parseGeneralLedger(data));
    AppResponse.success(res, "General ledger report generated.", data);
    return;
  } catch (error) {
    log.error({ error, userId: user!.id }, "Error generating ledger report");
    next(error);
    return;
  }
};

const creditorsHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { startDate, endDate } = req.body as z.infer<typeof dateFilterSchema>;
    const report = await getCreditorsList(user!.id, startDate, endDate);
    AppResponse.success(res, "Creditors list fetched successfully", report);
    return;
  } catch (error) {
    log.error(error, "Error fetching creditors list");
    next(error);
    return;
  }
};

const debtorsHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { startDate, endDate } = req.body as z.infer<typeof dateFilterSchema>;
    const report = await getDebtorsList(user!.id, startDate, endDate);
    AppResponse.success(res, "Debtors list fetched successfully", report);
    return;
  } catch (error) {
    log.error(error, "Error fetching debtors list");
    next(error);
    return;
  }
};

export {
  connectHandler,
  callbackHandler,
  disconnectHandler,
  qboCallbackSchema,
  dateFilterSchema,
  requestGeneralLedgerHandler,
  creditorsHandler,
  debtorsHandler,
};
