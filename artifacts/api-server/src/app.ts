import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const clientDistDir = path.resolve(serverDir, "../../mock-test/dist/public");
const shouldServeClient =
  process.env["NODE_ENV"] === "production" || process.env["SERVE_CLIENT"] === "true";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

if (shouldServeClient) {
  app.use(express.static(clientDistDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(path.join(clientDistDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

export default app;
