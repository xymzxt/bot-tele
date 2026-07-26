import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '../bot/context';
import { env } from '../config/env';
import { runtimeState } from '../services/runtime-state.service';
import { replyWithMainKeyboard } from '../bot/messages';

export const maintenanceGuardMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const isOwner = ctx.from?.id === env.OWNER_TELEGRAM_ID;
  if (runtimeState.isMaintenanceMode() && !isOwner) {
    await replyWithMainKeyboard(ctx, '🛠 Bot sedang maintenance. Coba lagi nanti.');
    return;
  }

  await next();
};

export const ownerOnly = async (ctx: BotContext, next: () => Promise<void>) => {
  if (!env.OWNER_TELEGRAM_ID || ctx.from?.id !== env.OWNER_TELEGRAM_ID) {
    await replyWithMainKeyboard(ctx, '⛔ Menu ini hanya untuk owner.');
    return;
  }
  await next();
};
