import { session, Telegraf } from 'telegraf';
import type { Update } from 'telegraf/types';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { BotContext } from './context';
import { BotSessionStore } from '../database/repositories/session.repository';
import { defaultSession } from '../types/session';
import { timingMiddleware } from '../middleware/timing.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { createUserMiddleware } from '../middleware/user.middleware';
import { maintenanceGuardMiddleware } from '../middleware/guard.middleware';
import { handleBotError } from '../middleware/error.middleware';
import { registerStartCommand } from '../commands/start.command';
import { registerHelpCommand } from '../commands/help.command';
import { registerMenuHandler } from '../handlers/menu.handler';
import { registerCallbackHandler } from '../handlers/callback.handler';
import { registerDocumentHandler } from '../handlers/document.handler';
import { registerConversationHandler } from '../handlers/message.handler';

let botInstance: Telegraf<BotContext> | null = null;

export const createBot = (): Telegraf<BotContext> => {
  if (botInstance) return botInstance;

  const bot = new Telegraf<BotContext>(env.BOT_TOKEN, {
    telegram: {
      webhookReply: false,
    },
  });

  bot.use(timingMiddleware);
  bot.use(
    session({
      store: new BotSessionStore(),
      defaultSession,
      getSessionKey: (ctx) => {
        if (!ctx.from || !ctx.chat) return undefined;
        return `${ctx.from.id}:${ctx.chat.id}`;
      },
    }),
  );
  bot.use(rateLimitMiddleware);
  bot.use(createUserMiddleware());
  bot.use(maintenanceGuardMiddleware);

  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerCallbackHandler(bot);
  registerDocumentHandler(bot);
  registerMenuHandler(bot);
  registerConversationHandler(bot);

  bot.catch((error, ctx) => handleBotError(error, ctx));

  botInstance = bot;
  logger.info('Bot initialized');
  return bot;
};

export const handleTelegramUpdate = async (update: Update): Promise<void> => {
  await createBot().handleUpdate(update);
};
