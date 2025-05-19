import express, { Express, Request, Response } from "express";
import config from "config";
import log from "./utils/logger";
import { testConnection } from "./models/db";
import { exceptionHandler, notfoundHandler } from "./middlewares";
import { AppResponse } from "./utils/helpers";
import routes from "./routes";

const app: Express = express();
const port = config.get<number>("port");

app.use(express.json());

app.get("/", (_: Request, res: Response) => {
  AppResponse.success(res, "Healthy");
});

app.use("/api", routes);
app.use(notfoundHandler);
app.use(exceptionHandler);

app.listen(port, () => {
  log.info(`Server is running at http://localhost:${port}`);
  testConnection().catch((e) => {
    log.error("Database connection test failed", e);
    process.exit(1);
  });
});

export default app;
