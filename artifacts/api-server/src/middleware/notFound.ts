/**
 * 404 handler — unknown routes under /api return JSON (not HTML).
 */
import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};
