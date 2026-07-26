import type { BotContext } from '../bot/context';
import { logger } from '../config/logger';
import { defaultSession } from '../types/session';
import { replyWithMainKeyboard } from '../bot/messages';

export const handleBotError = async (error: unknown, ctx: BotContext): Promise<void> => {
  logger.error(
    {
      error,
      requestId: ctx.requestId,
      updateId: ctx.update.update_id,
      userId: ctx.from?.id,
    },
    'Unhandled bot error',
  );

  if (ctx.session) ctx.session.state = 'idle';
  else ctx.session = defaultSession();

  try {
    await replyWithMainKeyboard(
      ctx,
      '⚠️ Terjadi error saat memproses request. Keyboard utama sudah dipulihkan. Silakan coba lagi.',
    );
  } catch (replyError) {
    logger.error({ replyError }, 'Failed to send error message');
  }
};
