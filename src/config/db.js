import mongoose from "mongoose";
import { env } from "./env.js";
import { runWithDatabase } from "./requestContext.js";

/**
 * Direct Worker mode deliberately creates one MongoDB connection per request.
 * Cloudflare Workers cannot safely reuse TCP sockets across separate requests.
 * This is simple and compatible, but adds connection latency; use a Durable
 * Object later if connection reuse becomes important.
 */
export async function withDatabase(req, res, next) {
  const connection = mongoose.createConnection();
  let closed = false;

  const closeConnection = () => {
    if (closed) return;
    closed = true;
    void connection.close().catch(error => {
      console.error("Failed to close request MongoDB connection:", error);
    });
  };

  try {
    await connection.openUri(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 0
    });

    res.once("finish", closeConnection);
    res.once("close", closeConnection);
    runWithDatabase(connection, next);
  } catch (error) {
    closeConnection();
    next(error);
  }
}
