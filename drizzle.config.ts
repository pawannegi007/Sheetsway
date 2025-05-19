import { defineConfig } from "drizzle-kit";
import config from "config";

type DBConfig = {
  connectionString: string;
};

const dbConfig = config.get<DBConfig>("db");

export default defineConfig({
  schema: "./src/models/schemas",
  out: "./src/models/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbConfig.connectionString,
  },
  verbose: true,
  strict: true,
});
