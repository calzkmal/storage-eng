import { createHash } from "node:crypto";
/** JSONB reorders object keys. Compare content, while retaining semantic array order. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonical(child)]));
  return value;
}
export function rowsFingerprint(rows: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(rows.map(row => JSON.stringify(canonical(row))).sort())).digest("hex");
}
