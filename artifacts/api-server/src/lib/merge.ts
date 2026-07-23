/**
 * Storage sync helpers — last-write-wins (full replace per key).
 */

/** Replace server/local value with the incoming payload; never wipe with null. */
export function replaceStorageValue(current: unknown, incoming: unknown): unknown {
  if (incoming === undefined || incoming === null) return current;
  return incoming;
}