import { z } from "zod";

export const qboCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  realmId: z.string().min(1),
});

export const generalLedgerPayloadSchema = z
  .object({
    userId: z.string().uuid(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Start date must be in YYYY-MM-DD format",
    }),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "End date must be in YYYY-MM-DD format",
    }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be greater than start date",
    path: ["endDate"],
  });

export const qboTokenSetSchema = z.object({
  access_token: z.string().min(1).optional().nullable(),
  refresh_token: z.string().min(1, { message: "Refresh token is required" }),
  realmId: z.string().min(1, { message: "Realm ID is required" }),
  expires_in: z.number().optional().nullable(),
  x_refresh_token_expires_in: z.number().optional().nullable(),
});

export type GeneralLedgerJobPayload = z.infer<
  typeof generalLedgerPayloadSchema
>;
export type DecryptedConnectionData = z.infer<typeof qboTokenSetSchema>;
