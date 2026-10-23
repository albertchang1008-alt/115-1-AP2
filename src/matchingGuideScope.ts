// Opaque per-account namespace; the material never receives the account UID.
export function matchingGuideScope(uid: string) {
  const key = `matching-guide-scope:${uid}`;
  try {
    let value = localStorage.getItem(key);
    if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); }
    return value;
  } catch { return null; }
}
