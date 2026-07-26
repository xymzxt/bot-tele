import crypto from 'node:crypto';
import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { BotContext } from '../bot/context';
import { cancelInlineKeyboard } from '../bot/keyboards';
import { replyWithInlineKeyboard, replyWithMainKeyboard } from '../bot/messages';
import { AIService } from '../ai/ai.service';
import { GitHubAuthService } from '../github/githubAuth.service';
import { GitHubService } from '../github/github.service';
import { ToolsService } from '../services/tools.service';
import { AIHistoryRepository } from '../database/repositories/ai-history.repository';
import type { AIMode } from '../types/session';
import { defaultSession, type DevToolMode } from '../types/session';
import { escapeHtml } from '../utils/format';

const aiModeLabels: Record<AIMode, string> = {
  chat: 'Chat AI',
  explain_code: 'Explain Code',
  generate_code: 'Generate Code',
  debug_code: 'Debug Code',
  refactor_code: 'Refactor Code',
  translate: 'Translate',
  summarize: 'Summarize',
  rewrite: 'Rewrite',
  ocr_image: 'OCR Image',
  image_caption: 'Image Caption',
  tts: 'Text To Speech',
};

export const registerConversationHandler = (
  bot: Telegraf<BotContext>,
  services = {
    githubAuth: new GitHubAuthService(),
    github: new GitHubService(),
    ai: new AIService(),
    tools: new ToolsService(),
    aiHistory: new AIHistoryRepository(),
  },
): void => {
  bot.on(message('text'), async (ctx) => {
    const text = ctx.message.text.trim();

    if (text.startsWith('/') && ctx.session.state === 'idle') return;

    switch (ctx.session.state) {
      case 'awaiting_github_pat':
        await handleGithubPat(ctx, text, services.githubAuth);
        return;
      case 'awaiting_github_repo_name':
        await handleCreateRepository(ctx, text, services.github);
        return;
      case 'awaiting_ai_input':
        await handleAiInput(ctx, text, services.ai, services.aiHistory);
        return;
      case 'awaiting_tool_input':
        await handleToolInput(ctx, text, services.tools);
        return;
      case 'awaiting_owner_broadcast':
        await replyWithMainKeyboard(ctx, '📢 Broadcast MVP: pesan diterima. Tambahkan query user + sendMessage batch di owner service untuk production broadcast.');
        ctx.session = defaultSession();
        return;
      case 'idle':
      default:
        await replyWithInlineKeyboard(
          ctx,
          [
            '🤖 Bot siap.',
            '',
            'Gunakan Reply Keyboard permanen untuk memilih fitur utama.',
            'Jika keyboard belum muncul, kirim /start.',
          ].join('\n'),
          cancelInlineKeyboard,
        );
    }
  });
};

const handleGithubPat = async (ctx: BotContext, token: string, githubAuth: GitHubAuthService): Promise<void> => {
  try {
    try {
      await ctx.deleteMessage();
    } catch {
      // Telegram may not allow deletion in every chat type.
    }

    const account = await githubAuth.connectWithPat(ctx.from!.id, token);
    ctx.session = defaultSession();
    await replyWithMainKeyboard(
      ctx,
      [
        '✅ <b>GitHub berhasil terhubung</b>',
        '',
        `Account : <b>${escapeHtml(account.login)}</b>`,
        'Token sudah dienkripsi dan tidak akan ditampilkan kembali.',
      ].join('\n'),
    );
  } catch (error) {
    ctx.session.state = 'awaiting_github_pat';
    await replyWithInlineKeyboard(
      ctx,
      `❌ PAT tidak valid atau gagal diverifikasi.\n\nError: <code>${escapeHtml(error instanceof Error ? error.message : String(error))}</code>\n\nKirim PAT lagi atau tekan Cancel.`,
      cancelInlineKeyboard,
    );
  }
};

const handleCreateRepository = async (ctx: BotContext, repoName: string, github: GitHubService): Promise<void> => {
  const result = await github.createRepository(ctx.from!.id, repoName);
  ctx.session = defaultSession();
  await replyWithMainKeyboard(ctx, result);
};

const handleAiInput = async (
  ctx: BotContext,
  input: string,
  ai: AIService,
  aiHistory: AIHistoryRepository,
): Promise<void> => {
  const mode = ctx.session.aiMode ?? 'chat';
  await ctx.reply(`⏳ Memproses ${aiModeLabels[mode]}...`);
  const result = await ai.run(mode, input);

  await aiHistory.create({
    telegram_user_id: ctx.from!.id,
    mode,
    prompt: input.slice(0, 4000),
    response: result.text.slice(0, 4000),
    provider: result.provider,
  });

  ctx.session = defaultSession();
  await replyWithMainKeyboard(
    ctx,
    [`🤖 <b>${escapeHtml(aiModeLabels[mode])}</b>`, '', result.text].join('\n'),
  );
};

const handleToolInput = async (ctx: BotContext, input: string, tools: ToolsService): Promise<void> => {
  const mode = ctx.session.toolMode as DevToolMode | undefined;
  if (!mode) {
    ctx.session = defaultSession();
    await replyWithMainKeyboard(ctx, 'Tool mode tidak ditemukan. Silakan pilih tool lagi.');
    return;
  }

  const result = await tools.run(mode, input);
  ctx.session = defaultSession();

  if (result.kind === 'image') {
    await ctx.replyWithPhoto({ source: result.buffer }, { caption: result.caption });
    await replyWithMainKeyboard(ctx, '✅ Selesai. Keyboard utama dipulihkan.');
    return;
  }

  await replyWithMainKeyboard(ctx, result.text);
};

export const enterAiMode = async (ctx: BotContext, mode: AIMode): Promise<void> => {
  ctx.session.state = 'awaiting_ai_input';
  ctx.session.aiMode = mode;
  await ctx.reply(
    [`🤖 <b>${escapeHtml(aiModeLabels[mode])}</b>`, '', 'Kirim teks/kode yang ingin diproses.'].join('\n'),
    {
      parse_mode: 'HTML',
      reply_markup: cancelInlineKeyboard,
    },
  );
};

export const enterToolMode = async (ctx: BotContext, mode: DevToolMode): Promise<void> => {
  ctx.session.state = 'awaiting_tool_input';
  ctx.session.toolMode = mode;
  await ctx.reply(['🌐 <b>Developer Tool</b>', '', `Mode: <code>${mode}</code>`, 'Kirim input sekarang.'].join('\n'), {
    parse_mode: 'HTML',
    reply_markup: cancelInlineKeyboard,
  });
};

export const runImmediateTool = async (ctx: BotContext, tool: 'uuid' | 'password_generate'): Promise<void> => {
  ctx.session = defaultSession();

  if (tool === 'uuid') {
    await replyWithMainKeyboard(ctx, `🆔 UUID\n\n<code>${crypto.randomUUID()}</code>`);
    return;
  }

  await replyWithMainKeyboard(ctx, `🔑 Password\n\n<code>${crypto.randomBytes(18).toString('base64url')}</code>`);
};
