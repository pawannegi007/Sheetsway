import express, { Router } from "express";
import oauth from "./oauth";
import { authenticate, validateRequestSchema } from "../../middlewares";
import {
  disconnectHandler,
  requestGeneralLedgerHandler,
  dateFilterSchema,
  creditorsHandler,
  debtorsHandler,
} from "../../services/quickbooks/handlers";

const router: Router = express.Router();

router.use("/oauth", oauth);
router.delete("/disconnect", authenticate, disconnectHandler);
router.post(
  "/general-ledger",
  authenticate,
  validateRequestSchema(dateFilterSchema),
  requestGeneralLedgerHandler
);

router.post(
  "/creditors",
  authenticate,
  validateRequestSchema(dateFilterSchema),
  creditorsHandler
);

router.post(
  "/debtors",
  authenticate,
  validateRequestSchema(dateFilterSchema),
  debtorsHandler
);

export default router;
