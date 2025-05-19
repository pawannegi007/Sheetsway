import { drizzle } from "drizzle-orm/node-postgres";
import config from "config";
import * as schemas from "./schemas";
import log from "../utils/logger";

const DATABASE_URL = config.get<string>("db.connectionString");
const db = drizzle(DATABASE_URL, { schema: schemas });
export default db;

export const testConnection = async () => {
  try {
    await db.execute("SELECT 1");
    log.info("Database connection test passed");
  } catch (error) {
    log.error("Database connection test failed", error);
    throw error;
  }
};
