import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

let server;

async function start() {
  await connectDatabase();
  server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Witch Woofie API listening on port ${env.PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  if (server) server.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch(error => {
  console.error("Failed to start API:", error);
  process.exit(1);
});
