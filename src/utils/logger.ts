// src/utils/logger.ts
import pino from "pino";
import config from "config";

const isDevelopment = process.env.NODE_ENV === "development";

// Get log level from config, default to 'info'
const logLevel = config.get<string>("logLevel") || "info";

const loggerOptions: pino.LoggerOptions = {
  level: logLevel,
  // Pretty print only in development
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true, // Colorize output
          translateTime: "SYS:standard", // Human-readable time format
          ignore: "pid,hostname", // Optional: ignore pid and hostname
        },
      }
    : undefined,
};

const log = pino(loggerOptions);

export default log;
