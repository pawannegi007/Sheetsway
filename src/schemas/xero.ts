import { z } from "zod";

export const xeroCallbackSchema = z.object({
  code: z.string().min(1),
  session_state: z.string().min(1),
  state: z.string().min(1),
});

export const xeroTokenSetSchema = z.object({
  id_token: z.string(),
  access_token: z.string(),
  expires_at: z.number(),
  token_type: z.string().optional(),
  refresh_token: z.string(),
  scope: z.string().optional(),
  session_state: z.string().optional(),
});

export const journatDateFilterSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Start date must be in YYYY-MM-DD format",
    })
    .optional(),
});
