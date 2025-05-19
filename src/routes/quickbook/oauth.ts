import { Router } from "express";
import { validateRequestSchema, authenticate } from "../../middlewares";
import {
  callbackHandler,
  connectHandler,
  qboCallbackSchema,
} from "../../services/quickbooks/handlers";

const router = Router();
router.get("/connect", authenticate, connectHandler);
router.get(
  "/callbacks",
  validateRequestSchema(qboCallbackSchema, "query"),
  callbackHandler
);

export default router;
