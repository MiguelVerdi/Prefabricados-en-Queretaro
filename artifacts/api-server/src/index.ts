import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Cloud Run forwards traffic to PORT on all network interfaces.
const server = app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Cloud Run sends SIGTERM before stopping an instance.
process.once("SIGTERM", () => {
  logger.info("Stopping server");
  const shutdownTimeout = setTimeout(() => process.exit(1), 8000);
  shutdownTimeout.unref();
  server.close((err) => {
    clearTimeout(shutdownTimeout);
    if (err) {
      logger.error({ err }, "Error stopping server");
      process.exitCode = 1;
    }
  });
});
