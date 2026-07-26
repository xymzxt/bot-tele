import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '../bot/context';
import { UserRepository } from '../database/repositories/user.repository';
import { StatsRepository } from '../database/repositories/stats.repository';
import { replyWithMainKeyboard } from '../bot/messages';

export const createUserMiddleware = (
  users = new UserRepository(),
  stats = new StatsRepository(),
): MiddlewareFn<BotContext> =>
  async (ctx, next) => {
    if (ctx.from) {
      ctx.user = await users.upsertFromTelegram(ctx.from);
      await stats.logActivity(ctx.from.id, 'request', {
        updateType: ctx.updateType,
        chatType: ctx.chat?.type,
      });

      if (ctx.user.is_banned) {
        await replyWithMainKeyboard(ctx, '🚫 Akun kamu sedang diblokir oleh owner.');
        return;
      }
    }

    await next();
  };
