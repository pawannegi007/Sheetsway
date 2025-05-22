import express, { Router } from "express";
import quickbooksRouter from "./quickbook";
import xeroRouter from "./xero";
import zohoRouter from "./zoho";
const router: Router = express.Router();

router.use("/quickbooks", quickbooksRouter);
router.use("/xero", xeroRouter);
router.use("/zoho", zohoRouter);
export default router;
