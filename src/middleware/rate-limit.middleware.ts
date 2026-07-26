import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '../bot/context';
import { env } from '../config/env';
import { InMemoryRateLimiter } from '../utils/rateLimiter';
import { replyWithMainKeyboard } from '../bot/messages';

const limiter = new InMemoryRateLimiter(env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX_REQUESTS);

export const rateLimitMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const key = String(ctx.from?.id ?? ctx.chat?.id ?? 'anonymous');
  const result = limiter.consume(key);

  if (!result.allowed) {
    await replyWithMainKeyboard(
      ctx,
      `⏳ Terlalu banyak request. Coba lagi dalam ${Math.ceil(result.retryAfterMs / 1000)} detik.`,
    );
    return;
  }

  await next();
};
