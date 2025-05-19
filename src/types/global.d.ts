interface UserAuthData {
  id: string;
  name: string;
}

interface BaseTokenSet {
  expires_at?: number;
  expires_in?: number;
  created_at?: number;
}

interface FormattedJournalLine {
  journalId: string;
  journalDate: string;
  journalNumber: number;
  reference: string;
  sourceType: string;
  journalLineId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  description: string;
  taxType: string;
  taxName: string;
  netAmount: number;
  grossAmount: number;
  taxAmount: number;
  postingType: "DEBIT" | "CREDIT";
}
