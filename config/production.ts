import "dotenv/config";

export default {
  port: process.env.PORT || 8080,
  application: {
    key: process.env.APPLICATION_KEY,
    secret: process.env.APPLICATION_SECRET,
  },
  logLevel: process.env.LOG_LEVEL || "info",
  db: {
    connectionString: process.env.DATABASE_URL,
  },
};
