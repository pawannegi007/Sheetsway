import { Queue } from "bullmq";
import config from "config";
import log from "./logger";
import Redis from "ioredis";

export const GENERAL_LEDGER_QUEUE = "general-ledger";

const redisConnectionString = config.get<string>("redis.connectionString");

const redisClient = new Redis(redisConnectionString, {
  maxRetriesPerRequest: null,
});

redisClient.on("connect", () => {
  log.info("Connected to Redis for BullMQ");
});

redisClient.on("error", (error) => {
  log.error({ error }, "Redis connection error for BullMQ");
});

const createQueue = (name: string): Queue => {
  log.info(`Initializing BullMQ Queue: ${name} using ioredis client`);
  const queue = new Queue(name, {
    connection: redisClient,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  queue.on("error", (error) => {
    log.error({ error, queue: name }, "BullMQ Queue Error");
  });

  return queue;
};

export const generalLedgerQueue = createQueue(GENERAL_LEDGER_QUEUE);

log.info("BullMQ Queues initialized.");
