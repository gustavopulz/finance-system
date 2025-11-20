import { env } from './env';

// Simples token bucket por IP (estado em memória)
const buckets = new Map<string, { tokens: number; last: number }>();

export function rateLimit(ip: string | null | undefined) {
  const now = Date.now();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const max = env.RATE_LIMIT_MAX;
  const key = ip ?? 'unknown';
  const b = buckets.get(key) ?? { tokens: max, last: now };

  const elapsed = now - b.last;
  const refill = Math.floor(elapsed / windowMs) * max;
  b.tokens = Math.min(max, b.tokens + (refill > 0 ? refill : 0));
  b.last = now;

  if (b.tokens <= 0) {
    buckets.set(key, b);
    return { allowed: false, remaining: 0 };
  }

  b.tokens -= 1;
  buckets.set(key, b);
  return { allowed: true, remaining: b.tokens };
}