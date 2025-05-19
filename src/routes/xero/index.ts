import express, { Router } from "express";
import oauth from "./oauth";
import { authenticate, validateRequestSchema } from "../../middlewares";
import { dateFilterSchema } from "../../schemas";
import {
  bankTransactionsHandler,
  journalHandler,
} from "../../services/xero/handlers";
import { journatDateFilterSchema } from "../../schemas/xero";

const router: Router = express.Router();

router.use("/oauth", oauth);
router.post(
  "/journals",
  authenticate,
  validateRequestSchema(journatDateFilterSchema),
  journalHandler,
);
router.post(
  "/bank-transactions",
  authenticate,
  validateRequestSchema(dateFilterSchema),
  bankTransactionsHandler,
);

export default router;
