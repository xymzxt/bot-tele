import type { Telegraf } from 'telegraf';
import type { BotContext } from '../bot/context';
import { showHome } from '../menus/main.menu';

export const registerStartCommand = (bot: Telegraf<BotContext>): void => {
  bot.start(async (ctx) => {
    await showHome(ctx);
  });
};
