import { AsyncLocalStorage } from "node:async_hooks";

const databaseContext = new AsyncLocalStorage();

export function runWithDatabase(connection, callback) {
  return databaseContext.run(connection, callback);
}

export function getDatabaseConnection() {
  const connection = databaseContext.getStore();
  if (!connection) {
    throw new Error("No MongoDB connection is available in the current request context.");
  }
  return connection;
}

export function getModel(name, schema) {
  const connection = getDatabaseConnection();
  return connection.models[name] || connection.model(name, schema);
}
