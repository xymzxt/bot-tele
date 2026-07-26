import type { Telegraf } from 'telegraf';
import type { BotContext } from '../bot/context';
import { cancelInlineKeyboard, removeKeyboard } from '../bot/keyboards';
import { replyWithInlineKeyboard, replyWithMainKeyboard } from '../bot/messages';
import { Callback } from '../constants/callbacks';
import { env } from '../config/env';
import { GitHubAuthService } from '../github/githubAuth.service';
import { GitHubService } from '../github/github.service';
import { DeployService } from '../deploy/deploy.service';
import { StatusService } from '../services/status.service';
import { runtimeState } from '../services/runtime-state.service';
import {
  enterAiMode,
  enterToolMode,
  runImmediateTool,
} from './message.handler';
import {
  showAIMenu,
  showDeployMenu,
  showDevToolsMenu,
  showFileManagerMenu,
  showGitHubConnectMenu,
  showGitHubMenu,
  showHome,
  showMonitoringMenu,
  showOwnerPanel,
  showProfile,
  showSettingsMenu,
} from '../menus/main.menu';
import { defaultSession, type AIMode, type DevToolMode } from '../types/session';
import { escapeHtml } from '../utils/format';

export const registerCallbackHandler = (
  bot: Telegraf<BotContext>,
  services = {
    githubAuth: new GitHubAuthService(),
    github: new GitHubService(),
    deploy: new DeployService(),
    status: new StatusService(),
  },
): void => {
  bot.on('callback_query', async (ctx) => {
    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
    if (!data) return;

    await ctx.answerCbQuery().catch(() => undefined);

    if (data === Callback.Cancel) {
      ctx.session = defaultSession();
      await replyWithMainKeyboard(ctx, '❌ Aksi dibatalkan. Keyboard utama dipulihkan.');
      return;
    }

    if (data === Callback.NavHome) {
      await showHome(ctx);
      return;
    }

    if (data === Callback.NavBack) {
      await routeBack(ctx);
      return;
    }

    if (data === Callback.NavRefresh) {
      await refreshCurrentMenu(ctx);
      return;
    }

    if (data.startsWith('menu:')) {
      await handleHomeMenuCallback(ctx, data);
      return;
    }

    if (data.startsWith('ai:')) {
      await enterAiMode(ctx, data.replace('ai:', '') as AIMode);
      return;
    }

    if (data.startsWith('tool:')) {
      const tool = data.replace('tool:', '');
      if (tool === 'uuid' || tool === 'password_generate') {
        await runImmediateTool(ctx, tool);
        return;
      }
      await enterToolMode(ctx, tool as DevToolMode);
      return;
    }

    if (data.startsWith('monitor:')) {
      await handleMonitoringCallback(ctx, data, services.status);
      return;
    }

    if (data.startsWith('settings:')) {
      await replyWithMainKeyboard(ctx, '⚙️ Settings MVP: konfigurasi detail dapat ditambahkan di tabel settings per user.');
      return;
    }

    if (data.startsWith('file:')) {
      await replyWithMainKeyboard(
        ctx,
        '📂 File Manager MVP: kirim dokumen/file ke chat ini. Bot akan menyimpan metadata dan, jika Supabase aktif, file dapat diupload ke storage.',
      );
      return;
    }

    await handleNamedCallback(ctx, data, services);
  });
};

const handleHomeMenuCallback = async (ctx: BotContext, data: string): Promise<void> => {
  switch (data) {
    case 'menu:ai':
      await showAIMenu(ctx);
      return;
    case 'menu:github':
      await showGitHubMenu(ctx);
      return;
    case 'menu:file':
      await showFileManagerMenu(ctx);
      return;
    case 'menu:deploy':
      await showDeployMenu(ctx);
      return;
    case 'menu:tools':
      await showDevToolsMenu(ctx);
      return;
    case 'menu:monitoring':
      await showMonitoringMenu(ctx);
      return;
    case 'menu:settings':
      await showSettingsMenu(ctx);
      return;
    case 'menu:profile':
      await showProfile(ctx);
      return;
    case 'menu:owner':
      await showOwnerPanel(ctx);
      return;
    default:
      await showHome(ctx);
  }
};

const handleNamedCallback = async (
  ctx: BotContext,
  data: string,
  services: {
    githubAuth: GitHubAuthService;
    github: GitHubService;
    deploy: DeployService;
    status: StatusService;
  },
): Promise<void> => {
  switch (data) {
    case Callback.GithubConnect:
      await showGitHubConnectMenu(ctx);
      return;

    case Callback.GithubOAuth: {
      const url = services.githubAuth.getOAuthUrl(ctx.from!.id);
      await replyWithInlineKeyboard(
        ctx,
        '🌐 <b>GitHub OAuth</b>\n\nKlik tombol di bawah untuk login GitHub lewat browser. Setelah authorize, bot akan menyimpan token secara terenkripsi.',
        {
          inline_keyboard: [
            [{ text: '🔑 Login GitHub', url }],
            [{ text: '❌ Cancel', callback_data: Callback.Cancel }],
          ],
        },
      );
      return;
    }

    case Callback.GithubPat:
      ctx.session.state = 'awaiting_github_pat';
      await ctx.reply(
        [
          '🔐 <b>Personal Access Token</b>',
          '',
          'Kirim GitHub PAT sekarang.',
          'Scope minimal yang disarankan: <code>repo</code> dan <code>read:user</code>.',
          '',
          'Keyboard disembunyikan sementara agar input token lebih aman. Tekan Cancel untuk batal.',
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: removeKeyboard },
      );
      await replyWithInlineKeyboard(ctx, 'Jika ingin batal, tekan tombol ini:', cancelInlineKeyboard);
      return;

    case Callback.GithubStatus:
      await replyWithMainKeyboard(ctx, await services.github.getStatusText(ctx.from!.id));
      return;

    case Callback.GithubRepos:
      await replyWithMainKeyboard(ctx, await services.github.listRepositories(ctx.from!.id));
      return;

    case Callback.GithubCreateRepo:
      ctx.session.state = 'awaiting_github_repo_name';
      await replyWithInlineKeyboard(ctx, '➕ Kirim nama repository baru. Contoh: <code>my-awesome-app</code>', cancelInlineKeyboard);
      return;

    case Callback.GithubDisconnect:
      await services.github.disconnect(ctx.from!.id);
      ctx.session = defaultSession();
      await replyWithMainKeyboard(ctx, '✅ GitHub account diputuskan dari bot.');
      return;

    case Callback.DeployVercel:
    case Callback.DeployNetlify:
    case Callback.DeployRender:
    case Callback.DeployHistory:
      await replyWithMainKeyboard(ctx, await services.deploy.listProviders());
      return;

    case Callback.OwnerBroadcast:
      if (ctx.from?.id !== env.OWNER_TELEGRAM_ID) {
        await replyWithMainKeyboard(ctx, '⛔ Hanya owner.');
        return;
      }
      ctx.session.state = 'awaiting_owner_broadcast';
      await replyWithInlineKeyboard(ctx, '📢 Kirim pesan broadcast sekarang.', cancelInlineKeyboard);
      return;

    case Callback.OwnerUsers:
      await replyWithMainKeyboard(ctx, await services.status.status());
      return;

    case Callback.OwnerHealth:
      await replyWithMainKeyboard(ctx, '🩺 Health Check OK. Webhook handler aktif, database dicek melalui menu Status.');
      return;

    case 'owner:maintenance_toggle':
      if (ctx.from?.id !== env.OWNER_TELEGRAM_ID) {
        await replyWithMainKeyboard(ctx, '⛔ Hanya owner.');
        return;
      }
      runtimeState.setMaintenanceMode(!runtimeState.isMaintenanceMode());
      await replyWithMainKeyboard(ctx, `🛠 Maintenance mode: <b>${runtimeState.isMaintenanceMode() ? 'ON' : 'OFF'}</b>`);
      return;

    default:
      await replyWithMainKeyboard(ctx, `Callback belum dikenali: <code>${escapeHtml(data)}</code>`);
  }
};

const handleMonitoringCallback = async (ctx: BotContext, data: string, status: StatusService): Promise<void> => {
  switch (data) {
    case 'monitor:ping':
      await replyWithMainKeyboard(ctx, await status.ping(ctx.requestStartedAt));
      return;
    case 'monitor:runtime':
      await replyWithMainKeyboard(ctx, status.runtime());
      return;
    case 'monitor:status':
      await replyWithMainKeyboard(ctx, await status.status());
      return;
    default:
      await replyWithMainKeyboard(ctx, 'Monitoring action belum dikenali.');
  }
};

const routeBack = async (ctx: BotContext): Promise<void> => {
  switch (ctx.session.lastMenu) {
    case 'ai':
      await showAIMenu(ctx);
      return;
    case 'github':
      await showGitHubMenu(ctx);
      return;
    case 'file':
      await showFileManagerMenu(ctx);
      return;
    case 'deploy':
      await showDeployMenu(ctx);
      return;
    case 'tools':
      await showDevToolsMenu(ctx);
      return;
    case 'monitoring':
      await showMonitoringMenu(ctx);
      return;
    case 'settings':
      await showSettingsMenu(ctx);
      return;
    case 'owner':
      await showOwnerPanel(ctx);
      return;
    default:
      await showHome(ctx);
  }
};

const refreshCurrentMenu = async (ctx: BotContext): Promise<void> => {
  await routeBack(ctx);
};
