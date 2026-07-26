import type { Telegraf } from 'telegraf';
import type { BotContext } from '../bot/context';
import { cancelInlineKeyboard, removeKeyboard, withNav } from '../bot/keyboards';
import {
  editOrReplyWithInlineKeyboard,
  replyWithInlineKeyboard,
  replyWithMainKeyboard,
} from '../bot/messages';
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
  showHomeMenu,
  showMonitoringMenu,
  showOwnerPanel,
  showProfile,
  showSettingsMenu,
} from '../menus/main.menu';
import { defaultSession, type AIMode, type DevToolMode } from '../types/session';
import { escapeHtml } from '../utils/format';

type MenuTarget =
  | 'home'
  | 'ai'
  | 'github'
  | 'github_connect'
  | 'file'
  | 'deploy'
  | 'tools'
  | 'monitoring'
  | 'settings'
  | 'profile'
  | 'owner';

const getTempString = (ctx: BotContext, key: string): string | undefined => {
  const value = ctx.session.temp?.[key];
  return typeof value === 'string' ? value : undefined;
};

const setBackTarget = (ctx: BotContext, backTo: MenuTarget): void => {
  ctx.session.temp = { ...(ctx.session.temp ?? {}), backTo };
};

const renderMenuTarget = async (ctx: BotContext, target: string): Promise<void> => {
  switch (target) {
    case 'ai':
      await showAIMenu(ctx);
      return;
    case 'github':
      await showGitHubMenu(ctx);
      return;
    case 'github_connect':
      await showGitHubConnectMenu(ctx);
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
    case 'profile':
      await showProfile(ctx);
      return;
    case 'owner':
      await showOwnerPanel(ctx);
      return;
    case 'home':
    default:
      await showHomeMenu(ctx);
  }
};

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
      await showHomeMenu(ctx);
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
      setBackTarget(ctx, 'settings');
      await editOrReplyWithInlineKeyboard(
        ctx,
        '⚙️ <b>Settings</b>\n\nSettings MVP: konfigurasi detail dapat ditambahkan di tabel settings per user.',
        withNav([]),
      );
      return;
    }

    if (data.startsWith('file:')) {
      setBackTarget(ctx, 'file');
      await editOrReplyWithInlineKeyboard(
        ctx,
        '📂 <b>File Manager</b>\n\nFile Manager MVP: kirim dokumen/file ke chat ini. Bot akan menyimpan metadata dan, jika Supabase aktif, file dapat diupload ke storage.',
        withNav([]),
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
      await showHomeMenu(ctx);
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
      setBackTarget(ctx, 'github_connect');
      const url = services.githubAuth.getOAuthUrl(ctx.from!.id);
      await editOrReplyWithInlineKeyboard(
        ctx,
        '🌐 <b>GitHub OAuth</b>\n\nKlik tombol di bawah untuk login GitHub lewat browser. Setelah authorize, bot akan menyimpan token secara terenkripsi.',
        {
          inline_keyboard: [
            [{ text: '🔑 Login GitHub', url }],
            [
              { text: '⬅️ Back', callback_data: Callback.NavBack },
              { text: '🏠 Home', callback_data: Callback.NavHome },
            ],
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
      setBackTarget(ctx, 'github');
      await editOrReplyWithInlineKeyboard(
        ctx,
        await services.github.getStatusText(ctx.from!.id),
        withNav([]),
      );
      return;

    case Callback.GithubRepos:
      setBackTarget(ctx, 'github');
      await editOrReplyWithInlineKeyboard(
        ctx,
        await services.github.listRepositories(ctx.from!.id),
        withNav([]),
      );
      return;

    case Callback.GithubCreateRepo:
      setBackTarget(ctx, 'github');
      ctx.session.state = 'awaiting_github_repo_name';
      await editOrReplyWithInlineKeyboard(
        ctx,
        '➕ Kirim nama repository baru. Contoh: <code>my-awesome-app</code>',
        cancelInlineKeyboard,
      );
      return;

    case Callback.GithubDisconnect:
      setBackTarget(ctx, 'github');
      await services.github.disconnect(ctx.from!.id);
      ctx.session = defaultSession();
      await editOrReplyWithInlineKeyboard(ctx, '✅ GitHub account diputuskan dari bot.', withNav([]));
      return;

    case Callback.DeployVercel:
    case Callback.DeployNetlify:
    case Callback.DeployRender:
    case Callback.DeployHistory:
      setBackTarget(ctx, 'deploy');
      await editOrReplyWithInlineKeyboard(ctx, await services.deploy.listProviders(), withNav([]));
      return;

    case Callback.OwnerBroadcast:
      if (ctx.from?.id !== env.OWNER_TELEGRAM_ID) {
        await replyWithMainKeyboard(ctx, '⛔ Hanya owner.');
        return;
      }
      setBackTarget(ctx, 'owner');
      ctx.session.state = 'awaiting_owner_broadcast';
      await editOrReplyWithInlineKeyboard(ctx, '📢 Kirim pesan broadcast sekarang.', cancelInlineKeyboard);
      return;

    case Callback.OwnerUsers:
      setBackTarget(ctx, 'owner');
      await editOrReplyWithInlineKeyboard(ctx, await services.status.status(), withNav([]));
      return;

    case Callback.OwnerHealth:
      setBackTarget(ctx, 'owner');
      await editOrReplyWithInlineKeyboard(
        ctx,
        '🩺 Health Check OK. Webhook handler aktif, database dicek melalui menu Status.',
        withNav([]),
      );
      return;

    case 'owner:maintenance_toggle':
      if (ctx.from?.id !== env.OWNER_TELEGRAM_ID) {
        await replyWithMainKeyboard(ctx, '⛔ Hanya owner.');
        return;
      }
      setBackTarget(ctx, 'owner');
      runtimeState.setMaintenanceMode(!runtimeState.isMaintenanceMode());
      await editOrReplyWithInlineKeyboard(
        ctx,
        `🛠 Maintenance mode: <b>${runtimeState.isMaintenanceMode() ? 'ON' : 'OFF'}</b>`,
        withNav([]),
      );
      return;

    default:
      await editOrReplyWithInlineKeyboard(
        ctx,
        `Callback belum dikenali: <code>${escapeHtml(data)}</code>`,
        withNav([]),
      );
  }
};

const handleMonitoringCallback = async (ctx: BotContext, data: string, status: StatusService): Promise<void> => {
  switch (data) {
    case 'monitor:ping':
      setBackTarget(ctx, 'monitoring');
      await editOrReplyWithInlineKeyboard(ctx, await status.ping(ctx.requestStartedAt), withNav([]));
      return;
    case 'monitor:runtime':
      setBackTarget(ctx, 'monitoring');
      await editOrReplyWithInlineKeyboard(ctx, status.runtime(), withNav([]));
      return;
    case 'monitor:status':
      setBackTarget(ctx, 'monitoring');
      await editOrReplyWithInlineKeyboard(ctx, await status.status(), withNav([]));
      return;
    default:
      await editOrReplyWithInlineKeyboard(ctx, 'Monitoring action belum dikenali.', withNav([]));
  }
};

const routeBack = async (ctx: BotContext): Promise<void> => {
  const backTo = getTempString(ctx, 'backTo') ?? 'home';
  await renderMenuTarget(ctx, backTo);
};

const refreshCurrentMenu = async (ctx: BotContext): Promise<void> => {
  const currentMenu = getTempString(ctx, 'currentMenu') ?? ctx.session.lastMenu ?? 'home';
  await renderMenuTarget(ctx, currentMenu);
};
