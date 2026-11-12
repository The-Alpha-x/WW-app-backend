import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Witch Woofie API listening on port ${env.PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
