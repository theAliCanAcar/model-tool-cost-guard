const keys = ['tokens', 'requests', 'costUsd'];
function nonnegative(value, label) { if (!Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be finite and nonnegative`); return value; }
/** Preflight estimated usage before a call; consume measured usage after a call or reserve it beforehand. */
export function createCostGuard({ limits = {}, now = Date.now } = {}) {
  const caps = {};
  for (const key of Object.keys(limits)) if (![...keys, 'elapsedMs'].includes(key)) throw new TypeError(`Unknown limit field: ${key}`);
  for (const key of [...keys, 'elapsedMs']) caps[key] = limits[key] === undefined ? Infinity : nonnegative(limits[key], `limits.${key}`);
  for (const key of ['tokens', 'requests']) if (Number.isFinite(caps[key]) && !Number.isSafeInteger(caps[key])) throw new TypeError(`${key} limit must be an integer`);
  const startedAt = nonnegative(now(), 'clock'); let lastNow = startedAt;
  const usage = { tokens: 0, requests: 0, costUsd: 0 };
  function elapsed() { const time = nonnegative(now(), 'clock'); if (time < lastNow) throw new Error('Clock moved backwards'); lastNow = time; return time - startedAt; }
  function normalize(delta) {
    const normalized = {};
    for (const key of Object.keys(delta)) if (!keys.includes(key)) throw new TypeError(`Unknown usage field: ${key}`);
    for (const key of keys) normalized[key] = nonnegative(delta[key] ?? (key === 'requests' ? 1 : 0), key);
    for (const key of ['tokens', 'requests']) if (!Number.isSafeInteger(normalized[key])) throw new TypeError(`${key} must be a safe integer`);
    return normalized;
  }
  const api = {
    check(delta = {}) {
      const increment = normalize(delta); const elapsedMs = elapsed();
      const projected = Object.fromEntries(keys.map(key => [key, usage[key] + increment[key]]));
      const exceeded = keys.filter(key => !Number.isFinite(projected[key]) || projected[key] > caps[key] || (key !== 'costUsd' && !Number.isSafeInteger(projected[key])));
      if (elapsedMs >= caps.elapsedMs) exceeded.push('elapsedMs');
      return { allowed: exceeded.length === 0, exceeded, projected: { ...projected, elapsedMs } };
    },
    consume(delta = {}) { const result = api.check(delta); if (!result.allowed) throw new Error(`Budget exceeded: ${result.exceeded.join(', ')}`); for (const key of keys) usage[key] = result.projected[key]; return api.snapshot(); },
    snapshot() { return { ...usage, elapsedMs: elapsed(), limits: { ...caps } }; },
  };
  return api;
}
export function demoCostGuard() {
  const guard = createCostGuard({ limits: { tokens: 1000, requests: 3, costUsd: 0.05, elapsedMs: 10000 }, now: () => 0 });
  guard.consume({ tokens: 600, costUsd: 0.02 });
  return { usage: guard.snapshot(), nextCall: guard.check({ tokens: 500, costUsd: 0.01 }) };
}
