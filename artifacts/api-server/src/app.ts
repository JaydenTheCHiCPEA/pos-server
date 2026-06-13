/**
 * Express application setup.
 *
 * Middleware order matters:
 * 1. Request logging (pino-http)
 * 2. CORS — allow Expo / web clients
 * 3. Body parsers — JSON + urlencoded
 * 4. attachUser — optional Bearer token (does not block)
 * 5. /api routes
 * 6. 404 + global error handler
 */
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { attachUser } from "./middleware/auth";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();

// ── 1. Structured request logging (method, path, status) ──────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── 2. CORS — mobile app and web preview need cross-origin access ───────────
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// ── 3. Parse JSON bodies from the Expo client ───────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── 4. Optional auth — attaches userId when Bearer token is valid ───────────
app.use(attachUser);

// ── 5. API routes (health, auth, storage sync) ──────────────────────────────
app.use("/api", router);

// ── 6. Fallback + error handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
