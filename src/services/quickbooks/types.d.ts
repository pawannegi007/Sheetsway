interface CreditorEntry {
  vendorName: string;
  current: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdue91plus: number;
  totalDue: number;
}

interface DebtorEntry {
  customerName: string;
  current: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdue91plus: number;
  totalDue: number;
}

interface JournalEntry {
  Id?: string;
  DocNumber?: string;
  TxnDate?: string;
  PrivateNote?: string;
  TxnStatus?: string;
  Line?: Array<{
    Id?: string;
    Description?: string;
    Amount?: number;
    DetailType?: string;
    JournalEntryLineDetail?: {
      PostingType?: string;
      AccountRef?: {
        value?: string;
        name?: string;
      };
      Entity?: {
        Type?: string;
        EntityRef?: {
          value?: string;
          name?: string;
        };
      };
    };
  }>;
  TxnTaxDetail?: any;
  CurrencyRef?: {
    value?: string;
    name?: string;
  };
  ExchangeRate?: number;
  createdTime?: string;
  lastUpdatedTime?: string;
  MetaData?: {
    CreateTime?: string;
    LastUpdatedTime?: string;
  };
}
