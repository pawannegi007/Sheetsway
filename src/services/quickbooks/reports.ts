import { GeneralLedgerJobPayload } from "../../schemas/qbo";
import {
  formatCreditorsData,
  formatDebtorsData,
  initQuickBooks,
  logQuickBooksError,
} from "./utils";

export const getGeneralLedger = async (data: GeneralLedgerJobPayload) => {
  const { userId, startDate, endDate } = data;
  const qbo = await initQuickBooks(userId);
  const reportOptions = {
    start_date: startDate,
    end_date: endDate,
  };

  return await new Promise((resolve, reject) => {
    qbo.reportGeneralLedgerDetail(
      reportOptions,
      (err: any, report: unknown) => {
        if (err) {
          logQuickBooksError(err, userId);
          return reject(err);
        }
        resolve(report);
      },
    );
  });
};

export const getCreditorsList = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<any> => {
  const qbo = await initQuickBooks(userId);
  const reportOptions = {
    start_date: startDate,
    end_date: endDate,
  };
  return new Promise((resolve, reject) => {
    qbo.reportAgedPayables(reportOptions, (err: any, report: any) => {
      if (err) return reject(err);
      const data = formatCreditorsData(report);
      resolve(data);
    });
  });
};

export const getDebtorsList = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<any> => {
  const qbo = await initQuickBooks(userId);
  const reportOptions = {
    start_date: startDate,
    end_date: endDate,
  };
  return new Promise((resolve, reject) => {
    qbo.reportAgedReceivables(reportOptions, (err: any, report: any) => {
      if (err) return reject(err);
      const data = formatDebtorsData(report);
      resolve(data);
    });
  });
};
