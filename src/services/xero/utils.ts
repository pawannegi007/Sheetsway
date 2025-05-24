import { XeroClient } from "xero-node";
import config from "config";
import db from "../../models/db";
import { and, eq } from "drizzle-orm";
import { Softwares } from "../../models/schemas";
import { Encryption, isTokenExpired } from "../../utils/helpers";
import { xeroTokenSetSchema } from "../../schemas/xero";
import logger from "../../utils/logger";

const XERO_CLIENT_ID = config.get<string>("modules.xero.clientId");
const XERO_CLIENT_SECRET = config.get<string>("modules.xero.clientSecret");
const XERO_REDIRECT_URI = config.get<string>("modules.xero.redirectUri");
const XERO_SCOPES = config.get<string[]>("modules.xero.scopes");

export const initXero = async (userId: string) => {
  const xero = new XeroClient({
    clientId: XERO_CLIENT_ID,
    clientSecret: XERO_CLIENT_SECRET,
    redirectUris: [XERO_REDIRECT_URI],
    scopes: XERO_SCOPES,
  });

  await xero.initialize();
  const softwareConnection = await db.query.Softwares.findFirst({
    where: and(
      eq(Softwares.user_id, userId),
      eq(Softwares.software_type, "Xero"),
    ),
  });

  if (!softwareConnection || !softwareConnection.connection_data) {
    throw new Error(`Xero connection not found for user ${userId}.`);
  }
  // decrypt the connection data
  const decryptedDataRaw = Encryption.decryptObject(
    softwareConnection.connection_data,
  );
  let tokenSet = xeroTokenSetSchema.parse(decryptedDataRaw);
  xero.setTokenSet(tokenSet);

  // Check if the token set is expired
  if (isTokenExpired(tokenSet)) {
    logger.info(`Xero token expired for user ${userId}. Refreshing...`);
    // Refresh the token set
    const newtoken = await xero.refreshToken();
    tokenSet = xeroTokenSetSchema.parse(newtoken);
    const encryptedPayload = Encryption.encrypt(JSON.stringify(tokenSet));
    await db
      .update(Softwares)
      .set({
        connection_data: encryptedPayload,
      })
      .where(
        and(eq(Softwares.user_id, userId), eq(Softwares.software_type, "Xero")),
      );
    logger.info(`Xero token refreshed for user ${userId}.`);
  }
  try {
    await xero.updateTenants();
  } catch (err) {
    logger.error(err, `Error updating tenants for user ${userId}`);
    throw new Error(
      "Error updating tenants, please reconnect your Xero account",
    );
  }

  const activeTenantId = xero.tenants[0].tenantId;
  return {
    xero,
    activeTenantId,
    tokenSet,
  };
};

export function formatXeroJournalEntries(
  journals: any,
): FormattedJournalLine[] {
  const result: FormattedJournalLine[] = [];

  for (const journal of journals) {
    const journalId = journal.journalID || "";
    const journalDate = journal.journalDate
      ? new Date(journal.journalDate).toISOString().split("T")[0]
      : "";
    const journalNumber = journal.journalNumber || 0;
    const reference = journal.reference || "";
    const sourceType = journal.sourceType || "";

    for (const line of journal.journalLines || []) {
      const netAmount = parseFloat(line.netAmount || "0");
      const postingType: "DEBIT" | "CREDIT" =
        netAmount >= 0 ? "DEBIT" : "CREDIT";
      result.push({
        journalId,
        journalDate,
        journalNumber,
        reference,
        sourceType,
        journalLineId: line.journalLineID || "",
        accountCode: line.accountCode || "",
        accountName: line.accountName || "",
        accountType: line.accountType || "",
        description: line.description || "",
        taxType: line.taxType || "",
        taxName: line.taxName || "",
        netAmount: Math.abs(netAmount),
        grossAmount: Math.abs(parseFloat(line.grossAmount || "0")),
        taxAmount: Math.abs(parseFloat(line.taxAmount || "0")),
        postingType,
      });
    }
  }

  return result;
}

export function mapXeroContactToUnified(contact: any) {
  return {
    id: contact.contactID || null,
    name: contact.name || null,
    displayName: contact.name || null,
    firstName: contact.contactPersons?.[0]?.firstName || null,
    lastName: contact.contactPersons?.[0]?.lastName || null,
    companyName: contact.name || null,
    status: contact.contactStatus || "ACTIVE",
    isCustomer: contact.isCustomer || false,
    isSupplier: contact.isSupplier || false,
    emails: contact.emailAddress
      ? [{ type: "PRIMARY", address: contact.emailAddress }]
      : [],
    phones: (contact.phones || [])
      .filter((p: any) => p.phoneNumber) // skip empty phone numbers
      .map((p: any) => ({
        type: p.phoneType || "OTHER",
        number: [
          p.phoneCountryCode || "",
          p.phoneAreaCode || "",
          p.phoneNumber || "",
        ]
          .filter(Boolean)
          .join("-"),
      })),
    addresses: (contact.addresses || []).map((addr: any) => ({
      type: addr.addressType || "OTHER",
      line1: addr.addressLine1 || "",
      line2: addr.addressLine2 || "",
      line3: addr.addressLine3 || "",
      line4: addr.addressLine4 || "",
      city: addr.city || "",
      region: addr.region || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "",
    })),
    contactPersons: (contact.contactPersons || []).map((p: any) => ({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      email: p.emailAddress || "",
      phone: p.phoneNumber || "",
    })),
    groups: (contact.contactGroups || []).map((g: any) => g.name || ""),
    currency: null, // Xero contact-level currency not present here
    balance: null, // not available in Xero contact object
    preferredDeliveryMethod: null,
    hasAttachments: contact.hasAttachments || false,
    hasValidationErrors: contact.hasValidationErrors || false,
    createdAt: null, // not included in payload
    updatedAt: contact.updatedDateUTC || null,
    source: "XERO",
  };
}
