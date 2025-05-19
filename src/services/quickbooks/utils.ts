import QuickBooks from "node-quickbooks";
import config from "config";
import { eq, and } from "drizzle-orm";
import { Softwares } from "../../models/schemas";
import db from "../../models/db";
import { Encryption } from "../../utils/helpers";
import logger from "../../utils/logger";
import { qboTokenSetSchema } from "../../schemas/qbo";

export const initQuickBooks = async (userId: string) => {
  const softwareConnection = await db.query.Softwares.findFirst({
    where: and(
      eq(Softwares.user_id, userId),
      eq(Softwares.software_type, "QuickBooks"),
    ),
  });

  if (!softwareConnection || !softwareConnection.connection_data) {
    throw new Error(`QuickBooks connection not found for user ${userId}.`);
  }
  // decrypt the connection data
  const decryptedDataRaw = Encryption.decryptObject(
    softwareConnection.connection_data,
  );
  const validConnData = qboTokenSetSchema.parse(decryptedDataRaw);
  const qbConfig = config.get<QuickbookConfig>("modules.quickbook");
  const qbo = new QuickBooks(
    qbConfig.clientId, // Consumer Key
    qbConfig.clientSecret, // Consumer Secret
    null, // validated access_token
    false, // No Token Secret for OAuth 2.0
    validConnData.realmId, // validated realmId
    qbConfig.environment === "sandbox", // sandbox
    false, // Debug
    "70", // Minor Version (example, use appropriate or null)
    "2.0", // oAuthVersion
    validConnData.refresh_token, // validated refresh_token
  );
  // refresh the access token
  await new Promise<void>((resolve, reject) => {
    qbo.refreshAccessToken((err: any, _: unknown) => {
      if (err) {
        const errorDetail = err.error || err.message || JSON.stringify(err);
        const intuitTid = err.intuit_tid;
        logger.error(
          {
            error: errorDetail,
            intuitTid: intuitTid,
            userId,
          },
          `QuickBooks token refresh failed for user ${userId}`,
        );
        return reject(
          new Error(`QuickBooks token refresh failed: ${errorDetail}`),
        );
      }
      logger.info(`QuickBooks token refresh successful for user ${userId}`);
      resolve();
    });
  });
  return qbo;
};

export const logQuickBooksError = (err: any, userId: string) => {
  const errorDetail = err.fault?.error || err;
  const intuitTid = err.intuit_tid;
  logger.error(
    {
      error: errorDetail,
      intuitTid,
      userId,
      realmId: err.realmId,
    },
    `QuickBooks API error for user ${userId}`,
  );
  return errorDetail;
};

export const formatCreditorsData = (report: any): CreditorEntry[] => {
  const formatted: CreditorEntry[] = [];
  const rows = report?.Rows?.Row;
  if (!Array.isArray(rows)) return formatted;

  for (const row of rows) {
    const cols = row?.ColData;
    if (!cols || cols.length < 7) continue;

    formatted.push({
      vendorName: cols[0]?.value || "Unknown Vendor",
      current: parseFloat(cols[1]?.value || "0"),
      overdue1to30: parseFloat(cols[2]?.value || "0"),
      overdue31to60: parseFloat(cols[3]?.value || "0"),
      overdue61to90: parseFloat(cols[4]?.value || "0"),
      overdue91plus: parseFloat(cols[5]?.value || "0"),
      totalDue: parseFloat(cols[6]?.value || "0"),
    });
  }

  return formatted;
};

export const formatDebtorsData = (report: any): DebtorEntry[] => {
  const formatted: DebtorEntry[] = [];
  const rows = report?.Rows?.Row;
  if (!Array.isArray(rows)) return formatted;

  for (const row of rows) {
    const cols = row?.ColData;
    if (!cols || cols.length < 7) continue;

    formatted.push({
      customerName: cols[0]?.value || "Unknown Customer",
      current: parseFloat(cols[1]?.value || "0"),
      overdue1to30: parseFloat(cols[2]?.value || "0"),
      overdue31to60: parseFloat(cols[3]?.value || "0"),
      overdue61to90: parseFloat(cols[4]?.value || "0"),
      overdue91plus: parseFloat(cols[5]?.value || "0"),
      totalDue: parseFloat(cols[6]?.value || "0"),
    });
  }

  return formatted;
};
