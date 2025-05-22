import { z } from "zod";

export const zohoCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
