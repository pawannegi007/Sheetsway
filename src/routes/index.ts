import express, { Router } from "express";
import quickbooksRouter from "./quickbook";
import xeroRouter from "./xero";
const router: Router = express.Router();

router.use("/quickbooks", quickbooksRouter);
router.use("/xero", xeroRouter);
export default router;
