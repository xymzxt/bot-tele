import { createBot } from './bot/createBot';
import { logger } from './config/logger';

const bot = createBot();

bot.launch({ dropPendingUpdates: false }).then(() => {
  logger.info('Bot started in long polling mode');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
