import { app } from "./app";
import { connectMongoDB } from "./config/mongodb";
import { connectNeo4j } from "./config/neo4j";
import { env } from "./config/env";
import { initializeMongoDBSchema } from "./repositories/mongodb-schema.repository";

const server = app.listen(env.port, () => {
  console.log(
    `Delivery Agent System API listening on http://localhost:${env.port}`,
  );
});

async function initializeDatabaseConnections(): Promise<void> {
  const results = await Promise.allSettled([
    connectMongoDB().then((client) => initializeMongoDBSchema(client.db())),
    connectNeo4j(),
  ]);

  for (const [index, result] of results.entries()) {
    const databaseName = index === 0 ? "MongoDB" : "Neo4j";

    if (result.status === "rejected") {
      console.warn(
        `${databaseName} connection unavailable: ${
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
        }`,
      );
    } else {
      console.log(
        databaseName === "MongoDB"
          ? "MongoDB connection established and schema initialized."
          : "Neo4j connection established.",
      );
    }
  }
}

void initializeDatabaseConnections();

function shutdown(signal: string): void {
  console.log(`${signal} received. Shutting down.`);
  server.close(() => process.exit(0));
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));