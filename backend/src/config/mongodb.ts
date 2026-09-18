import { MongoClient, type Db } from "mongodb";

import { env } from "./env";

export type DatabaseConnectionState =
  | "not_connected"
  | "connecting"
  | "connected"
  | "error";

let client: MongoClient | null = null;
let connectionState: DatabaseConnectionState = "not_connected";

export async function connectMongoDB(): Promise<MongoClient> {
  if (client && connectionState === "connected") {
    return client;
  }

  connectionState = "connecting";
  const nextClient = new MongoClient(env.mongodbUri, {
    serverSelectionTimeoutMS: env.mongodbServerSelectionTimeoutMs,
  });

  try {
    await nextClient.connect();
    await nextClient.db().command({ ping: 1 });
    client = nextClient;
    connectionState = "connected";
    return nextClient;
  } catch (error) {
    connectionState = "error";
    await nextClient.close().catch(() => undefined);
    throw error;
  }
}

export function getMongoDB(): Db {
  if (!client || connectionState !== "connected") {
    throw new Error("MongoDB is not connected.");
  }

  return client.db();
}

export async function disconnectMongoDB(): Promise<void> {
  await client?.close();
  client = null;
  connectionState = "not_connected";
}

export function getMongoDBConnectionState(): DatabaseConnectionState {
  return connectionState;
}