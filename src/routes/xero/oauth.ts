import express, { Router } from "express";
import { authenticate, validateRequestSchema } from "../../middlewares";
import { callbackHandler, connectHandler } from "../../services/xero/handlers";
import { xeroCallbackSchema } from "../../schemas/xero";

const router: Router = express.Router();
router.get("/connect", authenticate, connectHandler);
router.get(
  "/callbacks",
  validateRequestSchema(xeroCallbackSchema, "query"),
  callbackHandler,
);

export default router;
