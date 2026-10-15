import { SafeError } from './config.js';
const privateKey = /(?:email|e-mail|student.?id|學號|姓名|信箱|uid|user.?id|teacher.?ids?|display.?name|full.?name|^name$|student.?name|created.?by|updated.?by|actor|token|password|secret|roster|enrollment|profile|research.?id|answers|responses|attempted|wrong|cursor|^next$)/i;
const email = /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// Standalone student numbers; numeric runs within UUIDs/material IDs are not student IDs.
const studentNumber = /(?<![A-Za-z0-9_-])\d{8,12}(?![A-Za-z0-9_-])/g;
const jwt = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
export function cleanText(text: string): string {
  return text.replace(email, '[email removed]').replace(studentNumber, '[student number removed]').replace(jwt, '[token removed]');
}
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 40) throw new SafeError('OUTPUT_TOO_DEEP');
  if (typeof value === 'string') return cleanText(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([k]) => !privateKey.test(k) && cleanText(k) === k).map(([k,v]) => [k, redact(v, depth + 1)]));
  }
  return null;
}
export function privacyFindings(value: unknown): number {
  const text = JSON.stringify(value);
  return (text.match(email) || []).length + (text.match(studentNumber) || []).length + (text.match(jwt) || []).length;
}
export function safeOutput(value: unknown): unknown {
  const clean = redact(value);
  if (privacyFindings(clean)) throw new SafeError('PRIVACY_SCAN_FAILED');
  return clean;
}
