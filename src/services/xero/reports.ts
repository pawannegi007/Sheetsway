import {
  formatXeroJournalEntries,
  initXero,
  mapXeroContactToUnified,
} from "./utils";

export const getJournals = async (
  userId: string,
  startDate?: string,
): Promise<FormattedJournalLine[]> => {
  const { xero, activeTenantId } = await initXero(userId);
  const modifiedSince = startDate ? new Date(startDate) : undefined;
  const response = await xero.accountingApi.getJournals(
    activeTenantId,
    modifiedSince,
    0,
    false,
  );
  const journals = response.body.journals;
  return formatXeroJournalEntries(journals);
};

function toXeroDateTime(dateStr: string): string {
  const [year, month, day] = dateStr
    .split("-")
    .map((part) => parseInt(part, 10));
  return `DateTime(${year}, ${month}, ${day})`;
}

export const getBankTransactions = async (
  userId: string,
  startDate?: string,
  endDate?: string,
) => {
  const { xero, activeTenantId } = await initXero(userId);
  let where = "";

  if (startDate && endDate) {
    where = `Date >= ${toXeroDateTime(startDate)} && Date <= ${toXeroDateTime(endDate)}`;
  } else if (startDate) {
    where = `Date >= ${toXeroDateTime(startDate)}`;
  } else if (endDate) {
    where = `Date <= ${toXeroDateTime(endDate)}`;
  }

  const response = await xero.accountingApi.getBankTransactions(
    activeTenantId,
    undefined,
    where,
  );
  const bankTransactions = response.body.bankTransactions || [];
  return bankTransactions;
};

export const getCustomers = async (
  userId: string,
  page: number,
  pageSize: number,
) => {
  const { xero, activeTenantId } = await initXero(userId);
  const response = await xero.accountingApi.getContacts(
    activeTenantId,
    undefined,
    undefined,
    undefined,
    undefined,
    page,
    undefined,
    undefined,
    undefined,
    pageSize,
  );
  const contacts = response.body.contacts || [];
  const unifedContacts = contacts.map((contact) => {
    return mapXeroContactToUnified(contact);
  });
  return unifedContacts;
};
