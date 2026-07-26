import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { BotContext } from '../bot/context';
import { Buttons } from '../constants/buttons';
import {
  showAIMenu,
  showDeployMenu,
  showDevToolsMenu,
  showFileManagerMenu,
  showGitHubMenu,
  showHelp,
  showMonitoringMenu,
  showProfile,
  showSettingsMenu,
} from '../menus/main.menu';
import { StatusService } from '../services/status.service';
import { replyWithMainKeyboard } from '../bot/messages';

export const registerMenuHandler = (bot: Telegraf<BotContext>, status = new StatusService()): void => {
  bot.on(message('text'), async (ctx, next) => {
    const text = ctx.message.text;

    if (ctx.session.state !== 'idle') {
      await next();
      return;
    }

    switch (text) {
      case Buttons.AI:
        await showAIMenu(ctx);
        return;
      case Buttons.GitHub:
        await showGitHubMenu(ctx);
        return;
      case Buttons.FileManager:
        await showFileManagerMenu(ctx);
        return;
      case Buttons.Deploy:
        await showDeployMenu(ctx);
        return;
      case Buttons.DevTools:
        await showDevToolsMenu(ctx);
        return;
      case Buttons.Monitoring:
        await showMonitoringMenu(ctx);
        return;
      case Buttons.Settings:
        await showSettingsMenu(ctx);
        return;
      case Buttons.Profile:
        await showProfile(ctx);
        return;
      case Buttons.Ping:
        await replyWithMainKeyboard(ctx, await status.ping(ctx.requestStartedAt));
        return;
      case Buttons.Runtime:
        await replyWithMainKeyboard(ctx, status.runtime());
        return;
      case Buttons.Status:
        await replyWithMainKeyboard(ctx, await status.status());
        return;
      case Buttons.Help:
        await showHelp(ctx);
        return;
      default:
        await next();
    }
  });
};
