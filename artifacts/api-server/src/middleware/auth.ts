/**
 * Optional auth middleware — attaches `req.userId` when a valid Bearer token is present.
 * Routes that use this middleware still allow unauthenticated access where noted;
 * sync endpoints remain open so offline-first clients can push/pull without a token.
 */
import type { Request, RequestHandler } from "express";
import { getSessionUserId } from "../lib/sessions";

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Extract Bearer token from Authorization header. */
function extractToken(header: string | undefined): string | undefined {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice(7).trim();
}

/** Attach userId when token is valid; continue either way. */
export const attachUser: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  const userId = getSessionUserId(token);
  if (userId) {
    (req as AuthedRequest).userId = userId;
  }
  next();
};

/** Require a valid session — use on admin-only routes. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  const userId = getSessionUserId(token);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  (req as AuthedRequest).userId = userId;
  next();
};
