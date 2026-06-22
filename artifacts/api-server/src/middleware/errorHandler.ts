/**
 * Global error handler — catches unhandled errors from route handlers.
 * Always returns JSON so the mobile client can parse failures consistently.
 */
import type { ErrorRequestHandler } from "express";
import { logger } from "../lib/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, "Unhandled request error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
};
