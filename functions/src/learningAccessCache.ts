// Per-instance positive cache. Expiry is measured from when the read began,
// and hits never extend it. Bound the map even during bursts of cold requests.
export function positiveCache<T>(ttl: number, capacity: number) {
  const values = new Map<string, { expiresAt: number; value: T }>();
  return async (key: string, load: () => Promise<T | undefined>): Promise<T | undefined> => {
    const now = Date.now();
    const cached = values.get(key);
    if (cached && now < cached.expiresAt) return cached.value;
    values.delete(key);
    const value = await load();
    if (value !== undefined && Date.now() < now + ttl) {
      values.set(key, { expiresAt: now + ttl, value });
      if (values.size > capacity) values.delete(values.keys().next().value!);
    }
    return value;
  };
}
