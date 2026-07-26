interface Bucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {}

  consume(key: string): { allowed: true; remaining: number } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (current.count >= this.maxRequests) {
      return { allowed: false, retryAfterMs: current.resetAt - now };
    }

    current.count += 1;
    return { allowed: true, remaining: this.maxRequests - current.count };
  }
}
