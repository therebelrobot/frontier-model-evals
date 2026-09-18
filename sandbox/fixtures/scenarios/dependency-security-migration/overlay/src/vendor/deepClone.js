// Legacy recursive clone kept for backwards compatibility with older Node
// versions that predate structuredClone (Node <17). Flagged in
// SECURITY.md — do not use for new code.
export function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepClone);
  const out = {};
  for (const key in value) {
    out[key] = deepClone(value[key]);
  }
  return out;
}
