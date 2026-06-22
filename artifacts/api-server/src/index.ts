/**
<<<<<<< HEAD
 * Server entry point — initializes Neon DB, then listens.
=======
 * Server entry point — initializes Neon DB, seeds demo data, then listens.
>>>>>>> 044d5891246a55b19f65c682d0836a79ef42346e
 */
import app from "./app";
import { logger } from "./lib/logger";
import { initializeDatabase } from "./lib/db-init";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    await initializeDatabase();
    logger.info("Database ready");
  } catch (err) {
    logger.error({ err }, "Database initialization failed — server will not start");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "POS API server listening");
  });
}

start();
