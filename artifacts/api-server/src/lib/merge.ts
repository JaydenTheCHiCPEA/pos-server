/**
 * Storage sync helpers — last-write-wins (full replace per key).
 */

/** Replace server/local value entirely with the incoming payload. */
export function replaceStorageValue(_current: unknown, incoming: unknown): unknown {
  if (incoming === undefined) return _current;
  return incoming;
}