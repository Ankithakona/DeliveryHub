import express from "express";

import {
  getMongoDBConnectionState,
} from "./config/mongodb";
import { getNeo4jConnectionState } from "./config/neo4j";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler";
import authRouter from "./routes/auth.routes";
import agentRouter from "./routes/agent.routes";
import locationRouter from "./routes/location.routes";
import packageRouter from "./routes/package.routes";
import serviceRouter from "./routes/service.routes";
import userRouter from "./routes/user.routes";
import { successResponse } from "./utils/api-response";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json(
    successResponse("Service is healthy.", {
      status: "ok",
      service: "delivery-agent-system",
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: getMongoDBConnectionState(),
        neo4j: getNeo4jConnectionState(),
      },
    }),
  );
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/agents", agentRouter);
app.use("/api/services", serviceRouter);
app.use("/api/locations", locationRouter);
app.use("/api/packages", packageRouter);
app.use(notFoundHandler);
app.use(errorHandler);