import { randomUUID } from 'node:crypto';
import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '../bot/context';

export const timingMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  ctx.requestStartedAt = Date.now();
  ctx.requestId = randomUUID();
  await next();
};
