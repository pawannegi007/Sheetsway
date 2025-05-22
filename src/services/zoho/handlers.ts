import { RequestHandler } from "express";
import { XeroClient } from "xero-node";
import config from "config";
import { AppResponse, Encryption } from "../../utils/helpers";
import { Softwares, User } from "../../models/schemas";
import db from "../../models/db";
import { eq } from "drizzle-orm";
import logger from "../../utils/logger";
import { xeroCallbackSchema } from "../../schemas/xero";
import { z } from "zod";

const ZOHO_CLIENT_ID = config.get<string>("modules.zoho.clientId");
const ZOHO_CLIENT_SECRET = config.get<string>("modules.zoho.clientSecret");
const ZOHO_REDIRECT_URI = config.get<string>("modules.zoho.redirectUri");
const ZOHO_SCOPES = config.get<string[]>("modules.zoho.scopes");
const ZOHO_ACCOUNTS_URL = config.get<string[]>("modules.zoho.zohoAccountUrl");

/**
 * Function to connect with zoho to get auth url!...
 * @param req
 * @param res
 */

const connectHandler: RequestHandler = async (req, res) => {
  const user = req.user;
  const state = Encryption.encrypt(user!.id);
  /**
   * Url get get auth url!...
   */
  const authUrl = `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?scope=${encodeURIComponent(
    ZOHO_SCOPES.join(","),
  )}&client_id=${ZOHO_CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(
    ZOHO_REDIRECT_URI!,
  )}&state=${state}`;
  console.log("authUrl:::", authUrl);
  AppResponse.success(res, "Redirect user to Xero authorization URL", {
    authUrl: authUrl,
  });
};

const callbackHandler: RequestHandler = async (req, res, next) => {
  const { code, state } = req.query as z.infer<typeof xeroCallbackSchema>;
  const user_id = Encryption.decrypt(state);

  try {
    const qbConfig = config.get<QuickbookConfig>("modules.zoho");
    const tokenUrl = qbConfig.tokenEndpoint;
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code as string);
    params.append("redirect_uri", qbConfig.redirectUri);
    params.append("client_id", qbConfig.clientId);
    params.append("client_secret", qbConfig.clientSecret);
    console.log(tokenUrl, "00000000000000000000000000000000", params);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params,
    });

    const tokenData = await response.json();

    if (!response.ok) {
      console.error("Failed to exchange code for token", {
        status: response.status,
        data: tokenData,
      });
      AppResponse.error(
        res,
        `Failed to get token: ${
          tokenData.error_description || tokenData.error || "Unknown error"
        }`,
      );
      return;
    }

    console.log({ tokenData });

    const {
      access_token,
      refresh_token,
      scope,
      api_domain,
      token_type,
      expires_in,
    } = tokenData;
    const payload = {
      access_token,
      refresh_token,
      scope,
      api_domain,
      token_type,
      expires_in,
    };
    const encryptedPayload = Encryption.encryptObject(payload);

    // save the payload
    const userExists = db.query.User.findFirst({
      where: eq(User.id, user_id),
    });

    if (!userExists) {
      AppResponse.error(res, "User not found");
      return;
    }

    await db
      .insert(Softwares)
      .values([
        {
          user_id,
          software_type: "Zoho",
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
      console.log("------------------------------------------", error);
      // log.error("Error processing QuickBooks callback:", error);
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

export { connectHandler, callbackHandler };
