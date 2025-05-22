import { Router } from "express";
import { validateRequestSchema, authenticate } from "../../middlewares";
import { callbackHandler, connectHandler } from "../../services/zoho/handlers";
import { zohoCallbackSchema } from "../../schemas/zoho";

const router = Router();
router.get("/connect", authenticate, connectHandler);
router.get(
  "/callbacks",
  validateRequestSchema(zohoCallbackSchema, "query"),
  callbackHandler,
);

export default router;
