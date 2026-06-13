/**
 * Merge helpers for bidirectional sync.
 * Arrays are unioned by `id`; objects are shallow-merged (incoming wins on conflicts).
 */

export function mergeArraysById<T extends { id?: string }>(base: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of base) {
    if (item && typeof item === "object" && item.id != null) {
      map.set(String(item.id), item);
    }
  }
  for (const item of incoming) {
    if (item && typeof item === "object" && item.id != null) {
      map.set(String(item.id), item);
    }
  }
  return Array.from(map.values());
}

export function mergeStorageValue(current: unknown, incoming: unknown): unknown {
  if (Array.isArray(current) && Array.isArray(incoming)) {
    return mergeArraysById(current as { id?: string }[], incoming as { id?: string }[]);
  }

  if (Array.isArray(incoming) && !current) {
    return incoming;
  }

  if (
    incoming &&
    typeof incoming === "object" &&
    !Array.isArray(incoming) &&
    current &&
    typeof current === "object" &&
    !Array.isArray(current)
  ) {
    return { ...(current as object), ...(incoming as object) };
  }

  return incoming ?? current;
}
