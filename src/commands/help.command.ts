import type { Telegraf } from 'telegraf';
import type { BotContext } from '../bot/context';
import { StatusService } from '../services/status.service';
import { showGitHubMenu, showHelp, showOwnerPanel } from '../menus/main.menu';
import { replyWithMainKeyboard } from '../bot/messages';

export const registerHelpCommand = (bot: Telegraf<BotContext>, status = new StatusService()): void => {
  bot.help(async (ctx) => showHelp(ctx));

  bot.command('ping', async (ctx) => replyWithMainKeyboard(ctx, await status.ping(ctx.requestStartedAt)));
  bot.command('runtime', async (ctx) => replyWithMainKeyboard(ctx, status.runtime()));
  bot.command('status', async (ctx) => replyWithMainKeyboard(ctx, await status.status()));
  bot.command('github', async (ctx) => showGitHubMenu(ctx));
  bot.command('owner', async (ctx) => showOwnerPanel(ctx));
};
